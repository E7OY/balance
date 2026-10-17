import React, { createContext, useState, useEffect, useContext, useMemo, useRef } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { getFromLocalStorage, saveToLocalStorage } from '../utils/localStorage';
import { incomeCategories, expenseCategories } from '../utils/categories';
import { getMonthYear } from '../utils/helpers';
import { deleteInvoice, getInvoice, saveInvoice } from '../utils/invoiceStorage';
import { firebaseAuth, isFirebaseConfigured } from '../utils/firebaseClient';
import {
  deleteTransactionFromCloud,
  deleteTransactionsFromCloud,
  initializeAccountSync,
  loadCloudProfileLocally,
  saveProfileToCloud,
  saveTransactionToCloud,
  saveTransactionsToCloud,
  subscribeToProfile,
  subscribeToProfiles,
  subscribeToTransactions,
} from '../utils/firebaseSync';

const FinanceContext = createContext();

const PROFILES_KEY = 'financeProfiles';
const ACTIVE_PROFILE_KEY = 'financeActiveProfile';

const profileStorageKey = (profileId, key) => `finance:${profileId}:${key}`;
const getGoalsMonthKey = (year, month) => `${year}-${String(month + 1).padStart(2, '0')}`;
const normalizeMonthlyGoals = (goals) => ({
  savings: Number.isFinite(Number(goals?.savings)) ? Math.max(0, Number(goals.savings)) : 0,
  investment: Number.isFinite(Number(goals?.investment)) ? Math.max(0, Number(goals.investment)) : 0,
});
const normalizeMonthlyCategoryCaps = (caps) => Object.fromEntries(
  Object.entries(caps && typeof caps === 'object' && !Array.isArray(caps) ? caps : {})
    .filter(([, amount]) => Number.isFinite(Number(amount)) && Number(amount) > 0)
    .map(([category, amount]) => [category, Number(amount)]),
);

const loadProfileSetup = () => {
  const savedProfiles = getFromLocalStorage(PROFILES_KEY);
  const validProfiles = Array.isArray(savedProfiles)
    ? savedProfiles.filter((profile) => profile?.id && profile?.name)
    : [];
  const profiles = validProfiles.length > 0
    ? validProfiles
    : [{ id: 'default', name: 'Mi perfil' }];
  const storedActiveId = getFromLocalStorage(ACTIVE_PROFILE_KEY);
  const activeProfileId = profiles.some((profile) => profile.id === storedActiveId)
    ? storedActiveId
    : profiles[0].id;

  saveToLocalStorage(PROFILES_KEY, profiles);
  saveToLocalStorage(ACTIVE_PROFILE_KEY, activeProfileId);

  const namespacedTransactions = getFromLocalStorage(profileStorageKey(activeProfileId, 'transactions'));
  const namespacedCategories = getFromLocalStorage(profileStorageKey(activeProfileId, 'customCategories'));
  const savedGoals = getFromLocalStorage(profileStorageKey(activeProfileId, 'monthlyGoals'));
  const savedCategoryCaps = getFromLocalStorage(profileStorageKey(activeProfileId, 'monthlyCategoryCaps'));
  const initialGoalsMonthKey = getGoalsMonthKey(new Date().getFullYear(), new Date().getMonth());
  const monthlyGoalsByMonth = savedGoals && typeof savedGoals === 'object'
    ? (Object.hasOwn(savedGoals, 'savings') || Object.hasOwn(savedGoals, 'investment')
      ? { [initialGoalsMonthKey]: normalizeMonthlyGoals(savedGoals) }
      : Object.fromEntries(
        Object.entries(savedGoals).map(([monthKey, goals]) => [monthKey, normalizeMonthlyGoals(goals)]),
      ))
    : {};
  const monthlyCategoryCapsByMonth = savedCategoryCaps && typeof savedCategoryCaps === 'object'
    ? Object.fromEntries(
      Object.entries(savedCategoryCaps).map(([monthKey, caps]) => [monthKey, normalizeMonthlyCategoryCaps(caps)]),
    )
    : {};
  const isDefaultProfile = activeProfileId === 'default';
  const legacyTransactions = isDefaultProfile ? getFromLocalStorage('transactions') : null;
  const legacyCategories = isDefaultProfile ? getFromLocalStorage('customCategories') : null;
  const transactions = namespacedTransactions ?? legacyTransactions ?? [];
  const categories = namespacedCategories ?? legacyCategories;

  if (namespacedTransactions === null && legacyTransactions !== null) {
    saveToLocalStorage(profileStorageKey(activeProfileId, 'transactions'), legacyTransactions);
  }
  if (namespacedCategories === null && legacyCategories !== null) {
    saveToLocalStorage(profileStorageKey(activeProfileId, 'customCategories'), legacyCategories);
  }

  return {
    profiles,
    activeProfileId,
    transactions: Array.isArray(transactions) ? transactions : [],
    monthlyGoalsByMonth,
    monthlyCategoryCapsByMonth,
    customCategories: {
      Ingreso: Array.isArray(categories?.Ingreso) ? categories.Ingreso : [],
      Gasto: Array.isArray(categories?.Gasto) ? categories.Gasto : [],
    },
  };
};

const buildInstallmentLabel = (description, category, current, total) => {
  const baseLabel = (description || category || 'Movimiento').trim();
  return `${baseLabel} (${current}/${total})`;
};

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildInstallmentRecords = (transaction, totalInstallments) => {
  const installments = Number(totalInstallments);
  if (!Number.isFinite(installments) || installments <= 1) {
    return [transaction];
  }

  const totalAmount = Number(transaction.amount) || 0;
  const baseAmount = totalAmount / installments;
  const seriesId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const originalDate = new Date(`${transaction.date}T00:00:00`);

  return Array.from({ length: installments }, (_, index) => {
    const installmentIndex = index + 1;
    const installmentDate = new Date(originalDate);
    installmentDate.setMonth(originalDate.getMonth() + index);
    const lastDayOfMonth = new Date(
      installmentDate.getFullYear(),
      installmentDate.getMonth() + 1,
      0,
    ).getDate();
    installmentDate.setDate(Math.min(originalDate.getDate(), lastDayOfMonth));

    const normalizedAmount = installmentIndex === installments
      ? Number((totalAmount - baseAmount * (installments - 1)).toFixed(2))
      : Number(baseAmount.toFixed(2));

    return {
      ...transaction,
      id: installmentIndex === 1 ? transaction.id : `${transaction.id}-${installmentIndex}`,
      amount: normalizedAmount,
      date: formatLocalDate(installmentDate),
      description: buildInstallmentLabel(transaction.description, transaction.category, installmentIndex, installments),
      installment: {
        total: installments,
        current: installmentIndex,
        seriesId,
      },
      isInstallment: true,
    };
  });
};

export const FinanceProvider = ({ children }) => {
  const [initialProfileSetup] = useState(loadProfileSetup);
  const [profiles, setProfiles] = useState(initialProfileSetup.profiles);
  const [activeProfileId, setActiveProfileId] = useState(initialProfileSetup.activeProfileId);
  const [transactions, setTransactions] = useState(() => {
    return initialProfileSetup.transactions;
  });
  const [customCategories, setCustomCategories] = useState(initialProfileSetup.customCategories);
  const [monthlyGoalsByMonth, setMonthlyGoalsByMonth] = useState(initialProfileSetup.monthlyGoalsByMonth);
  const [monthlyCategoryCapsByMonth, setMonthlyCategoryCapsByMonth] = useState(initialProfileSetup.monthlyCategoryCapsByMonth);
  const [syncUser, setSyncUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState(isFirebaseConfigured ? 'local' : 'unconfigured');
  const [syncError, setSyncError] = useState('');
  const [syncRetryKey, setSyncRetryKey] = useState(0);
  const syncMetadataRef = useRef('');
  const syncTransactionsRef = useRef('');
  const knownProfileIdsRef = useRef(new Set());
  const syncErrorHandler = useRef(null);
  const [isAmountsHidden, setIsAmountsHidden] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filters, setFilters] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    type: 'Todos',
    category: 'Todas',
    searchTerm: '',
  });
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) || profiles[0];

  syncErrorHandler.current = (error) => {
    console.error('No se pudieron sincronizar los datos con Firebase.', error);
    setSyncError(error.message || 'No se pudieron sincronizar los datos con Firebase.');
    setSyncStatus('error');
  };

  useEffect(() => {
    if (!firebaseAuth) return undefined;
    let active = true;
    let authChange = 0;
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      const currentChange = ++authChange;
      setSyncUser(user);
      setSyncError('');
      syncMetadataRef.current = '';
      syncTransactionsRef.current = '';
      if (!user) {
        setSyncStatus('local');
        return;
      }

      setSyncStatus('syncing');
      try {
        const synced = await initializeAccountSync(user);
        if (!active || currentChange !== authChange) return;
        knownProfileIdsRef.current = new Set(synced.profiles.map((profile) => profile.id));
        setProfiles(synced.profiles);
        setActiveProfileId(synced.activeProfileId);
        setTransactions(synced.transactions);
        setCustomCategories(synced.customCategories);
        setMonthlyGoalsByMonth(synced.monthlyGoalsByMonth);
        setMonthlyCategoryCapsByMonth(synced.monthlyCategoryCapsByMonth);
        setSyncStatus('synced');
      } catch (error) {
        if (active && currentChange === authChange) {
          syncErrorHandler.current?.(error);
        }
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [syncRetryKey]);

  useEffect(() => {
    if (!syncUser || syncStatus !== 'synced') return undefined;
    return subscribeToProfiles(syncUser.uid, (remoteProfiles) => {
      const profilesToLoad = remoteProfiles.filter((profile) => (
        !knownProfileIdsRef.current.has(profile.id)
      ));
      profilesToLoad.forEach((profile) => {
        knownProfileIdsRef.current.add(profile.id);
      });
      Promise.all(profilesToLoad.map((profile) => (
        loadCloudProfileLocally(syncUser.uid, profile.id)
      ))).then(() => {
        setProfiles((previousProfiles) => (
          remoteProfiles.length > 0 ? remoteProfiles : previousProfiles
        ));
      }).catch((error) => {
        syncErrorHandler.current?.(error);
      });
    }, (error) => syncErrorHandler.current?.(error));
  }, [syncUser, syncStatus]);

  useEffect(() => {
    if (!syncUser || syncStatus !== 'synced') return undefined;
    const unsubscribeMetadata = subscribeToProfile(
      syncUser.uid,
      activeProfileId,
      (metadata) => {
        const remoteState = {
          name: metadata.name || activeProfile.name,
          customCategories: metadata.customCategories || { Ingreso: [], Gasto: [] },
          monthlyGoalsByMonth: metadata.monthlyGoalsByMonth || {},
          monthlyCategoryCapsByMonth: metadata.monthlyCategoryCapsByMonth || {},
        };
        syncMetadataRef.current = JSON.stringify(remoteState);
        setProfiles((previousProfiles) => previousProfiles.map((profile) => (
          profile.id === activeProfileId && profile.name !== remoteState.name
            ? { ...profile, name: remoteState.name }
            : profile
        )));
        setCustomCategories((previous) => (
          JSON.stringify(previous) === JSON.stringify(remoteState.customCategories)
            ? previous
            : remoteState.customCategories
        ));
        setMonthlyGoalsByMonth((previous) => (
          JSON.stringify(previous) === JSON.stringify(remoteState.monthlyGoalsByMonth)
            ? previous
            : remoteState.monthlyGoalsByMonth
        ));
        setMonthlyCategoryCapsByMonth((previous) => (
          JSON.stringify(previous) === JSON.stringify(remoteState.monthlyCategoryCapsByMonth)
            ? previous
            : remoteState.monthlyCategoryCapsByMonth
        ));
      },
      (error) => syncErrorHandler.current?.(error),
    );
    const unsubscribeTransactions = subscribeToTransactions(
      syncUser.uid,
      activeProfileId,
      (remoteTransactions) => {
        setTransactions((previous) => {
          const localTransactions = new Map(previous.map((transaction) => [transaction.id, transaction]));
          const transactionsWithLocalInvoices = remoteTransactions.map((transaction) => {
            const cloudTransaction = { ...transaction };
            delete cloudTransaction.invoice;
            const localInvoice = localTransactions.get(transaction.id)?.invoice;
            return localInvoice ? { ...cloudTransaction, invoice: localInvoice } : cloudTransaction;
          });
          const remoteJson = JSON.stringify(transactionsWithLocalInvoices);
          syncTransactionsRef.current = remoteJson;
          return JSON.stringify(previous) === remoteJson ? previous : transactionsWithLocalInvoices;
        });
      },
      (error) => syncErrorHandler.current?.(error),
    );
    return () => {
      unsubscribeMetadata();
      unsubscribeTransactions();
    };
  }, [syncUser, syncStatus, activeProfileId]);

  useEffect(() => {
    if (!syncUser || syncStatus !== 'synced') return;
    const metadata = {
      id: activeProfileId,
      name: activeProfile.name,
      customCategories,
      monthlyGoalsByMonth,
      monthlyCategoryCapsByMonth,
    };
    const metadataJson = JSON.stringify(metadata);
    if (metadataJson === syncMetadataRef.current) return;
    syncMetadataRef.current = metadataJson;
    saveProfileToCloud(syncUser.uid, activeProfile, {
      customCategories,
      monthlyGoalsByMonth,
      monthlyCategoryCapsByMonth,
    }).catch((error) => syncErrorHandler.current?.(error));
  }, [
    syncUser,
    syncStatus,
    activeProfileId,
    activeProfile,
    customCategories,
    monthlyGoalsByMonth,
    monthlyCategoryCapsByMonth,
  ]);

  const createSyncAccount = async (email, password) => {
    if (!firebaseAuth) throw new Error('Configura Firebase antes de activar la sincronización.');
    await createUserWithEmailAndPassword(firebaseAuth, email, password);
  };

  const loginToSyncAccount = async (email, password) => {
    if (!firebaseAuth) throw new Error('Configura Firebase antes de activar la sincronización.');
    await signInWithEmailAndPassword(firebaseAuth, email, password);
  };

  const logoutFromSyncAccount = async () => {
    if (!firebaseAuth) return;
    await signOut(firebaseAuth);
  };

  const retrySync = () => {
    if (!syncUser) return;
    setSyncError('');
    setSyncStatus('syncing');
    setSyncRetryKey((previousKey) => previousKey + 1);
  };

  const runCloudOperation = (operation) => {
    operation.then(() => {
      setSyncError('');
      setSyncStatus((previous) => (previous === 'error' ? 'synced' : previous));
    }).catch((error) => syncErrorHandler.current?.(error));
  };

  useEffect(() => {
    saveToLocalStorage(profileStorageKey(activeProfileId, 'transactions'), transactions);
  }, [activeProfileId, transactions]);

  useEffect(() => {
    saveToLocalStorage(profileStorageKey(activeProfileId, 'customCategories'), customCategories);
  }, [activeProfileId, customCategories]);

  useEffect(() => {
    saveToLocalStorage(profileStorageKey(activeProfileId, 'monthlyGoals'), monthlyGoalsByMonth);
  }, [activeProfileId, monthlyGoalsByMonth]);

  useEffect(() => {
    saveToLocalStorage(profileStorageKey(activeProfileId, 'monthlyCategoryCaps'), monthlyCategoryCapsByMonth);
  }, [activeProfileId, monthlyCategoryCapsByMonth]);

  useEffect(() => {
    saveToLocalStorage(PROFILES_KEY, profiles);
  }, [profiles]);

  const switchProfile = (profileId) => {
    const nextProfile = profiles.find((profile) => profile.id === profileId);
    if (!nextProfile || profileId === activeProfileId) return;

    saveToLocalStorage(profileStorageKey(activeProfileId, 'transactions'), transactions);
    saveToLocalStorage(profileStorageKey(activeProfileId, 'customCategories'), customCategories);
    setTransactions(getFromLocalStorage(profileStorageKey(profileId, 'transactions')) || []);
    const storedCategories = getFromLocalStorage(profileStorageKey(profileId, 'customCategories'));
    setCustomCategories({
      Ingreso: Array.isArray(storedCategories?.Ingreso) ? storedCategories.Ingreso : [],
      Gasto: Array.isArray(storedCategories?.Gasto) ? storedCategories.Gasto : [],
    });
    const storedGoals = getFromLocalStorage(profileStorageKey(profileId, 'monthlyGoals'));
    setMonthlyGoalsByMonth(storedGoals && typeof storedGoals === 'object'
      ? (Object.hasOwn(storedGoals, 'savings') || Object.hasOwn(storedGoals, 'investment')
        ? { [getGoalsMonthKey(filters.year, filters.month)]: normalizeMonthlyGoals(storedGoals) }
        : storedGoals)
      : {});
    const storedCategoryCaps = getFromLocalStorage(profileStorageKey(profileId, 'monthlyCategoryCaps'));
    setMonthlyCategoryCapsByMonth(storedCategoryCaps && typeof storedCategoryCaps === 'object'
      ? Object.fromEntries(
        Object.entries(storedCategoryCaps).map(([monthKey, caps]) => [monthKey, normalizeMonthlyCategoryCaps(caps)]),
      )
      : {});
    setEditingTransaction(null);
    setIsModalOpen(false);
    setActiveProfileId(profileId);
    saveToLocalStorage(ACTIVE_PROFILE_KEY, profileId);
  };

  const addProfile = (name) => {
    const normalizedName = name.trim();
    if (!normalizedName) throw new Error('Escribe un nombre para el perfil.');
    if (normalizedName.length > 40) throw new Error('El nombre del perfil no puede superar los 40 caracteres.');
    if (profiles.some((profile) => profile.name.toLocaleLowerCase('es') === normalizedName.toLocaleLowerCase('es'))) {
      throw new Error('Ya existe un perfil con ese nombre.');
    }
    const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newProfile = { id, name: normalizedName };
    setProfiles((previousProfiles) => [...previousProfiles, newProfile]);
    setTransactions([]);
    setCustomCategories({ Ingreso: [], Gasto: [] });
    setMonthlyGoalsByMonth({});
    setMonthlyCategoryCapsByMonth({});
    setEditingTransaction(null);
    setIsModalOpen(false);
    setActiveProfileId(id);
    saveToLocalStorage(profileStorageKey(id, 'transactions'), []);
    saveToLocalStorage(profileStorageKey(id, 'customCategories'), { Ingreso: [], Gasto: [] });
    saveToLocalStorage(profileStorageKey(id, 'monthlyGoals'), {});
    saveToLocalStorage(profileStorageKey(id, 'monthlyCategoryCaps'), {});
    saveToLocalStorage(ACTIVE_PROFILE_KEY, id);
    if (syncUser && syncStatus === 'synced') {
      runCloudOperation(saveProfileToCloud(syncUser.uid, newProfile, {
        customCategories: { Ingreso: [], Gasto: [] },
        monthlyGoalsByMonth: {},
        monthlyCategoryCapsByMonth: {},
      }));
    }
    return newProfile;
  };

  const addCategory = (type, name) => {
    const normalizedName = name.trim();
    if (!['Ingreso', 'Gasto'].includes(type)) {
      throw new Error('Selecciona si la categoría es para un ingreso o un gasto.');
    }
    if (!normalizedName) throw new Error('Escribe un nombre para la categoría.');
    if (normalizedName.length > 40) throw new Error('El nombre no puede superar los 40 caracteres.');

    const builtInCategories = type === 'Ingreso' ? incomeCategories : expenseCategories;
    const existingCategories = [...builtInCategories, ...customCategories[type]];
    if (existingCategories.some((category) => category.toLocaleLowerCase('es') === normalizedName.toLocaleLowerCase('es'))) {
      throw new Error('Ya existe una categoría con ese nombre.');
    }

    setCustomCategories((previous) => ({
      ...previous,
      [type]: [...previous[type], normalizedName],
    }));
    return normalizedName;
  };

  const deleteCategory = (type, name) => {
    if (!['Ingreso', 'Gasto'].includes(type)) {
      throw new Error('Selecciona si la categoría es de un ingreso o de un gasto.');
    }
    if (!customCategories[type].includes(name)) {
      throw new Error('Solo se pueden eliminar las categorías que has creado.');
    }

    setCustomCategories((previous) => ({
      ...previous,
      [type]: previous[type].filter((category) => category !== name),
    }));
    if (type === 'Gasto') {
      setMonthlyCategoryCapsByMonth((previousCaps) => Object.fromEntries(
        Object.entries(previousCaps).map(([monthKey, caps]) => {
          const nextCaps = { ...caps };
          delete nextCaps[name];
          return [monthKey, nextCaps];
        }),
      ));
    }
    setFilters((previous) => (
      previous.category === name ? { ...previous, category: 'Todas' } : previous
    ));
  };

  const addTransaction = async ({ invoiceFile, ...transaction }) => {
    const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const installmentTotal = Number(transaction.installmentTotal);
    const isInstallment = Boolean(transaction.isInstallment) && Number.isFinite(installmentTotal) && installmentTotal > 1;
    const baseTransaction = {
      ...transaction,
      id,
      ...(invoiceFile && {
        invoice: { name: invoiceFile.name, type: invoiceFile.type, size: invoiceFile.size },
      }),
    };

    const entriesToAdd = isInstallment ? buildInstallmentRecords(baseTransaction, installmentTotal) : [baseTransaction];

    if (invoiceFile && entriesToAdd[0]) {
      await saveInvoice(entriesToAdd[0].id, invoiceFile, activeProfileId);
    }

    setTransactions((prevTransactions) => [...entriesToAdd, ...prevTransactions]);
    if (syncUser && syncStatus === 'synced') {
      runCloudOperation(Promise.all(entriesToAdd.map((entry) => (
        saveTransactionToCloud(syncUser.uid, activeProfileId, entry)
      ))));
    }
  };

  const updateTransaction = async (id, updates) => {
    const existingTransaction = transactions.find((transaction) => transaction.id === id);
    if (!existingTransaction) throw new Error('No se encontró el movimiento que quieres editar.');

    if (updates.invoiceFile) {
      await saveInvoice(id, updates.invoiceFile, activeProfileId);
    } else if (updates.removeInvoice && existingTransaction.invoice) {
      await deleteInvoice(id, activeProfileId);
    }

    setTransactions((previousTransactions) => previousTransactions.map((transaction) => {
      if (transaction.id !== id) return transaction;

      const { invoiceFile, removeInvoice, ...fields } = updates;
      return {
        ...transaction,
        ...fields,
        ...(invoiceFile && {
          invoice: {
            name: invoiceFile.name,
            type: invoiceFile.type,
            size: invoiceFile.size,
          },
        }),
        ...(removeInvoice && !invoiceFile && { invoice: undefined }),
      };
    }));
    if (syncUser && syncStatus === 'synced') {
      const nextTransaction = {
        ...existingTransaction,
        ...Object.fromEntries(Object.entries(updates).filter(([key]) => (
          !['invoiceFile', 'removeInvoice'].includes(key)
        ))),
      };
      if (updates.invoiceFile) {
        nextTransaction.invoice = {
          name: updates.invoiceFile.name,
          type: updates.invoiceFile.type,
          size: updates.invoiceFile.size,
        };
      } else if (updates.removeInvoice) {
        delete nextTransaction.invoice;
      }
      runCloudOperation(saveTransactionToCloud(syncUser.uid, activeProfileId, nextTransaction));
    }
  };

  const splitTransaction = (id, totalInstallments) => {
    const sourceTransaction = transactions.find((transaction) => transaction.id === id);
    const installmentCount = Number(totalInstallments);
    if (!sourceTransaction) throw new Error('No se encontró el movimiento que quieres dividir.');
    if (sourceTransaction.type !== 'Gasto') throw new Error('Solo se pueden dividir los gastos.');
    if (sourceTransaction.installment?.seriesId) throw new Error('Este movimiento ya forma parte de un pago a plazos.');
    if (!Number.isInteger(installmentCount) || installmentCount < 2 || installmentCount > 24) {
      throw new Error('El número de cuotas debe estar entre 2 y 24.');
    }

    const installmentRecords = buildInstallmentRecords(sourceTransaction, installmentCount)
      .map((record, index) => {
        if (index === 0 || !record.invoice) return record;
        const { invoice, ...recordWithoutInvoice } = record;
        return recordWithoutInvoice;
      });
    setTransactions((previousTransactions) => previousTransactions.flatMap((transaction) => (
      transaction.id === id ? installmentRecords : [transaction]
    )));
    if (syncUser && syncStatus === 'synced') {
      runCloudOperation((async () => {
        await deleteTransactionFromCloud(syncUser.uid, activeProfileId, id);
        await Promise.all(installmentRecords.map((record) => (
          saveTransactionToCloud(syncUser.uid, activeProfileId, record)
        )));
      })());
    }
  };

  const deleteTransaction = async (id) => {
    const targetTransaction = transactions.find((transaction) => transaction.id === id);
    const seriesId = targetTransaction?.installment?.seriesId;

    if (targetTransaction?.invoice) {
      await deleteInvoice(id, activeProfileId);
    }

    const removedTransactions = targetTransaction?.installment?.seriesId
      ? transactions.filter((transaction) => transaction.installment?.seriesId === seriesId)
      : [targetTransaction];
    const nextTransactions = targetTransaction?.installment?.seriesId
      ? transactions.filter((transaction) => transaction.installment?.seriesId !== seriesId)
      : transactions.filter((transaction) => transaction.id !== id);

    setTransactions((prevTransactions) => {
      if (!seriesId) {
        return prevTransactions.filter((transaction) => transaction.id !== id);
      }

      return prevTransactions.filter((transaction) => transaction.installment?.seriesId !== seriesId);
    });
    if (syncUser && syncStatus === 'synced') {
      runCloudOperation((async () => {
        await deleteTransactionsFromCloud(
          syncUser.uid,
          activeProfileId,
          removedTransactions.filter(Boolean).map((transaction) => transaction.id),
        );
      })());
    }
  };

  const previewInvoice = async (id) => {
    const invoice = await getInvoice(id, activeProfileId);
    if (!invoice?.blob) {
      throw new Error('La factura solo está disponible en el dispositivo donde se adjuntó.');
    }

    return URL.createObjectURL(invoice.blob);
  };

  const downloadInvoice = async (id, filename) => {
    const invoice = await getInvoice(id, activeProfileId);
    if (!invoice?.blob) {
      throw new Error('La factura solo está disponible en el dispositivo donde se adjuntó.');
    }

    const objectUrl = URL.createObjectURL(invoice.blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename || invoice.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  const monthlyTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const { year: transactionYear, month: transactionMonth } = getMonthYear(transaction.date);
      return transactionYear === filters.year && transactionMonth === filters.month;
    });
  }, [transactions, filters.year, filters.month]);

  const filteredTransactions = useMemo(() => {
    return monthlyTransactions.filter((transaction) => {
      const matchesType = 
        filters.type === 'Todos' || transaction.type === filters.type;

      const matchesCategory = 
        filters.category === 'Todas' || transaction.category === filters.category;

      const searchTerm = filters.searchTerm.toLocaleLowerCase('es');
      const matchesSearchTerm = [
        transaction.description || '',
        transaction.category || '',
        transaction.paymentMethod || '',
      ].some((value) => value.toLocaleLowerCase('es').includes(searchTerm));

      return matchesType && matchesCategory && matchesSearchTerm;
    });
  }, [monthlyTransactions, filters.type, filters.category, filters.searchTerm]);

  const totalBalance = useMemo(() => {
    return monthlyTransactions.reduce((acc, transaction) => {
      return transaction.type === 'Ingreso'
        ? acc + parseFloat(transaction.amount)
        : acc - parseFloat(transaction.amount);
    }, 0);
  }, [monthlyTransactions]);

  const totalIncome = useMemo(() => {
    return monthlyTransactions.reduce((acc, transaction) => {
      return transaction.type === 'Ingreso'
        ? acc + parseFloat(transaction.amount)
        : acc;
    }, 0);
  }, [monthlyTransactions]);

  const activeGoalsMonthKey = getGoalsMonthKey(filters.year, filters.month);
  const monthlyGoals = monthlyGoalsByMonth[activeGoalsMonthKey] || { savings: 0, investment: 0 };
  const setMonthlyGoals = (goals) => {
    setMonthlyGoalsByMonth((previousGoals) => ({
      ...previousGoals,
      [activeGoalsMonthKey]: normalizeMonthlyGoals(goals),
    }));
  };
  const activeCategoryCapsMonthKey = getGoalsMonthKey(filters.year, filters.month);
  const monthlyCategoryCaps = monthlyCategoryCapsByMonth[activeCategoryCapsMonthKey] || {};
  const setMonthlyCategoryCap = (category, value) => {
    const amount = value === '' ? 0 : Number(value);
    if (!Number.isFinite(amount)) return;
    setMonthlyCategoryCapsByMonth((previousCaps) => {
      const monthCaps = { ...(previousCaps[activeCategoryCapsMonthKey] || {}) };
      if (amount > 0) monthCaps[category] = amount;
      else delete monthCaps[category];
      return {
        ...previousCaps,
        [activeCategoryCapsMonthKey]: normalizeMonthlyCategoryCaps(monthCaps),
      };
    });
  };

  const setMonthlyCategoryCaps = (caps) => {
    setMonthlyCategoryCapsByMonth((previousCaps) => ({
      ...previousCaps,
      [activeCategoryCapsMonthKey]: normalizeMonthlyCategoryCaps(caps),
    }));
  };
  const previousMonthDate = new Date(filters.year, filters.month - 1, 1);
  const previousMonthKey = getGoalsMonthKey(previousMonthDate.getFullYear(), previousMonthDate.getMonth());
  const previousMonthGoals = monthlyGoalsByMonth[previousMonthKey] || { savings: 0, investment: 0 };
  const previousMonthCategoryCaps = monthlyCategoryCapsByMonth[previousMonthKey] || {};

  const totalExpenses = useMemo(() => {
    return monthlyTransactions.reduce((acc, transaction) => {
      return transaction.type === 'Gasto'
        ? acc + parseFloat(transaction.amount)
        : acc;
    }, 0);
  }, [monthlyTransactions]);

  const expenseBreakdown = useMemo(() => {
    const breakdown = {};
    monthlyTransactions
      .filter(t => t.type === 'Gasto')
      .forEach(t => {
        const category = t.category;
        breakdown[category] = (breakdown[category] || 0) + parseFloat(t.amount);
      });

    const total = Object.values(breakdown).reduce((sum, amount) => sum + amount, 0);

    return Object.entries(breakdown).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    })).sort((a,b) => b.amount - a.amount);

  }, [monthlyTransactions]);

  const exportData = async () => {
    const exportTransactions = await Promise.all(transactions.map(async (transaction) => {
      if (!transaction.invoice) return transaction;
      const invoice = await getInvoice(transaction.id, activeProfileId);
      if (!invoice?.blob) {
        throw new Error(`La factura "${transaction.invoice.name}" solo está disponible en el dispositivo donde se adjuntó.`);
      }
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('No se pudo incluir una factura en la copia.'));
        reader.readAsDataURL(invoice.blob);
      });
      return {
        ...transaction,
        invoice: { ...transaction.invoice, dataUrl },
      };
    }));
    
    // AQUÍ ESTÁ EL CAMBIO: Se añaden las metas y topes mensuales al JSON de exportación
    const dataStr = JSON.stringify({ 
      version: 2, 
      transactions: exportTransactions, 
      customCategories,
      monthlyGoalsByMonth,         // Nuevo
      monthlyCategoryCapsByMonth   // Nuevo
    }, null, 2);
    
    const fileUrl = URL.createObjectURL(new Blob([dataStr], { type: 'application/json' }));
    const downloadLink = document.createElement('a');
    downloadLink.href = fileUrl;
    downloadLink.download = 'finanzas_personales.json';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
  };

  const exportCsv = async () => {
    const { exportTransactionsCsv } = await import('../utils/reportExports');
    exportTransactionsCsv(transactions);
  };

  const exportPdf = async () => {
    const { exportTransactionsPdf } = await import('../utils/reportExports');
    exportTransactionsPdf(transactions);
  };

  const importData = async (file) => {
    let backup;
    try {
      backup = JSON.parse(await file.text());
    } catch {
      throw new Error('No se pudo leer la copia. Comprueba que sea un archivo JSON válido.');
    }
    const importedTransactions = Array.isArray(backup) ? backup : backup?.transactions;
    if (!Array.isArray(importedTransactions)) {
      throw new Error('La copia no contiene una lista válida de movimientos.');
    }

    const restoredTransactions = await Promise.all(importedTransactions.map(async (transaction) => {
      if (!transaction || typeof transaction !== 'object' || !transaction.id) {
        throw new Error('La copia contiene un movimiento con datos no válidos.');
      }
      const invoice = transaction.invoice;
      if (!invoice?.dataUrl) return transaction;
      const response = await fetch(invoice.dataUrl);
      if (!response.ok) throw new Error(`No se pudo recuperar la factura "${invoice.name}".`);
      const blob = await response.blob();
      await saveInvoice(transaction.id, new File([blob], invoice.name || 'factura', {
        type: invoice.type || blob.type,
      }), activeProfileId);
      const invoiceMetadata = { ...invoice };
      delete invoiceMetadata.dataUrl;
      return { ...transaction, invoice: invoiceMetadata };
    }));

    if (!Array.isArray(backup)) {
      const importedCategories = backup.customCategories;
      if (importedCategories && typeof importedCategories === 'object') {
        setCustomCategories({
          Ingreso: Array.isArray(importedCategories.Ingreso) ? importedCategories.Ingreso.filter((name) => typeof name === 'string') : [],
          Gasto: Array.isArray(importedCategories.Gasto) ? importedCategories.Gasto.filter((name) => typeof name === 'string') : [],
        });
      }
      
      // AQUÍ ESTÁ EL CAMBIO: Restaurar metas y topes desde el backup
      if (backup.monthlyGoalsByMonth && typeof backup.monthlyGoalsByMonth === 'object') {
        setMonthlyGoalsByMonth(backup.monthlyGoalsByMonth);
      }
      if (backup.monthlyCategoryCapsByMonth && typeof backup.monthlyCategoryCapsByMonth === 'object') {
        setMonthlyCategoryCapsByMonth(backup.monthlyCategoryCapsByMonth);
      }
    }
    
    setTransactions(restoredTransactions);
    if (syncUser && syncStatus === 'synced') {
      runCloudOperation((async () => {
        await saveTransactionsToCloud(syncUser.uid, activeProfileId, restoredTransactions);
      })());
    }
  };

  const allCategories = useMemo(() => ({
    Ingreso: [...incomeCategories, ...customCategories.Ingreso],
    Gasto: [...expenseCategories, ...customCategories.Gasto],
    Todas: [...incomeCategories, ...customCategories.Ingreso, ...expenseCategories, ...customCategories.Gasto],
  }), [customCategories]);

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        profiles,
        activeProfile,
        activeProfileId,
        syncUser,
        syncStatus,
        syncError,
        isFirebaseConfigured,
        createSyncAccount,
        loginToSyncAccount,
        logoutFromSyncAccount,
        retrySync,
        monthlyGoals,
        monthlyGoalsByMonth,
        setMonthlyGoals,
        previousMonthGoals,
        monthlyCategoryCaps,
        setMonthlyCategoryCap,
        setMonthlyCategoryCaps,
        previousMonthCategoryCaps,
        isAmountsHidden,
        setIsAmountsHidden,
        addProfile,
        switchProfile,
        addTransaction,
        splitTransaction,
        addCategory,
        deleteCategory,
        deleteTransaction,
        previewInvoice,
        downloadInvoice,
        totalBalance,
        totalIncome,
        totalExpenses,
        expenseBreakdown,
        filters,
        setFilters,
        isModalOpen,
        setIsModalOpen,
        editingTransaction,
        setEditingTransaction,
        updateTransaction,
        exportData,
        exportCsv,
        exportPdf,
        importData,
        customCategories,
        allCategories,
        filteredTransactions,
        monthlyTransactions,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);