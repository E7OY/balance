import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from './firebaseClient';
import { getFromLocalStorage, saveToLocalStorage } from './localStorage';

const PROFILES_KEY = 'financeProfiles';
const ACTIVE_PROFILE_KEY = 'financeActiveProfile';
const SYNC_OWNER_KEY = 'balance-sync-owner';
const profileKey = (profileId, key) => `finance:${profileId}:${key}`;

// --- ENRUTADOR DE CUENTAS COMPARTIDAS ---
const resolvePath = (uid, profileId) => {
  if (profileId && profileId.includes('___')) {
    const parts = profileId.split('___');
    return { uid: parts[0], profileId: parts[1] };
  }
  return { uid, profileId };
};

const userProfiles = (uid) => collection(firestore, 'users', uid, 'profiles');

const userProfile = (uid, profileId) => {
  const path = resolvePath(uid, profileId);
  return doc(firestore, 'users', path.uid, 'profiles', path.profileId);
};

const userTransactions = (uid, profileId) => {
  const path = resolvePath(uid, profileId);
  return collection(userProfile(path.uid, path.profileId), 'transactions');
};

const userTransaction = (uid, profileId, transactionId) => {
  const path = resolvePath(uid, profileId);
  return doc(userProfile(path.uid, path.profileId), 'transactions', transactionId);
};

const cleanUndefined = (value) => {
  if (Array.isArray(value)) return value.map(cleanUndefined);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, cleanUndefined(item)]),
  );
};

const saveInBatches = async (writes) => {
  for (let offset = 0; offset < writes.length; offset += 450) {
    const batch = writeBatch(firestore);
    writes.slice(offset, offset + 450).forEach(({ reference, data, remove }) => {
      if (remove) batch.delete(reference);
      else batch.set(reference, cleanUndefined(data));
    });
    await batch.commit();
  }
};

const profileMetadata = (profile, localData) => ({
  id: profile.id,
  name: profile.name,
  customCategories: localData.customCategories,
  monthlyGoalsByMonth: localData.monthlyGoalsByMonth,
  monthlyCategoryCapsByMonth: localData.monthlyCategoryCapsByMonth,
  investmentRecords: localData.investmentRecords,
});

const emptyProfileData = {
  transactions: [],
  customCategories: { Ingreso: [], Gasto: [] },
  monthlyGoalsByMonth: {},
  monthlyCategoryCapsByMonth: {},
  investmentRecords: [],
};

const readLocalProfile = (profileId) => ({
  transactions: getFromLocalStorage(profileKey(profileId, 'transactions')) || [],
  customCategories: getFromLocalStorage(profileKey(profileId, 'customCategories')) || {
    Ingreso: [],
    Gasto: [],
  },
  monthlyGoalsByMonth: getFromLocalStorage(profileKey(profileId, 'monthlyGoals')) || {},
  monthlyCategoryCapsByMonth: getFromLocalStorage(profileKey(profileId, 'monthlyCategoryCaps')) || {},
  investmentRecords: getFromLocalStorage(profileKey(profileId, 'investments')) || [],
});

const writeLocalProfile = (profileId, data) => {
  saveToLocalStorage(profileKey(profileId, 'transactions'), data.transactions);
  saveToLocalStorage(profileKey(profileId, 'customCategories'), data.customCategories);
  saveToLocalStorage(profileKey(profileId, 'monthlyGoals'), data.monthlyGoalsByMonth);
  saveToLocalStorage(profileKey(profileId, 'monthlyCategoryCaps'), data.monthlyCategoryCapsByMonth);
  saveToLocalStorage(profileKey(profileId, 'investments'), data.investmentRecords || []);
};

export const saveProfileBookmark = (uid, profile) =>
  saveInBatches([{
    reference: doc(firestore, 'users', uid, 'profiles', profile.id),
    data: { id: profile.id, name: profile.name, isSharedBookmark: true },
  }]);

export const deleteProfileBookmark = (uid, profileId) =>
  saveInBatches([{
    reference: doc(firestore, 'users', uid, 'profiles', profileId),
    remove: true,
  }]);

export const initializeAccountSync = async (user) => {
  const previousOwner = getFromLocalStorage(SYNC_OWNER_KEY);
  const mayMergeLocalData = !previousOwner || previousOwner === user.uid;
  const localProfiles = mayMergeLocalData ? getFromLocalStorage(PROFILES_KEY) || [] : [];
  const localActiveId = mayMergeLocalData ? getFromLocalStorage(ACTIVE_PROFILE_KEY) : null;
  const remoteProfileSnapshots = await getDocs(userProfiles(user.uid));
  const remoteProfiles = new Map(
    remoteProfileSnapshots.docs.map((snapshot) => [snapshot.id, snapshot.data()]),
  );
  const localById = new Map(localProfiles.map((profile) => [profile.id, profile]));
  const profiles = [];
  const seenNames = new Set();

  for (const [id, remote] of remoteProfiles) {
    const local = localById.get(id);
    const name = remote.name || local?.name || 'Mi perfil';
    profiles.push({ id, name });
    seenNames.add(name.toLocaleLowerCase('es'));
  }

  for (const local of localProfiles) {
    if (!local?.id || remoteProfiles.has(local.id)) continue;
    const normalizedName = local.name.toLocaleLowerCase('es');
    if (seenNames.has(normalizedName)) continue;
    profiles.push(local);
    seenNames.add(normalizedName);
  }

  if (profiles.length === 0) profiles.push({ id: 'default', name: 'Mi perfil' });

  for (const profile of profiles) {
    let remoteMetadata = remoteProfiles.get(profile.id);
    
    // Si es una cuenta compartida, buscamos los metadatos reales del propietario
    if (profile.id.includes('___')) {
      const ownerSnap = await getDoc(userProfile(user.uid, profile.id));
      if (ownerSnap.exists()) {
        remoteMetadata = ownerSnap.data();
      }
    }

    const local = localById.has(profile.id) ? readLocalProfile(profile.id) : emptyProfileData;
    const remoteTransactionSnapshots = remoteMetadata
      ? await getDocs(userTransactions(user.uid, profile.id))
      : { docs: [] };
    const localTransactionsById = new Map(local.transactions.map((transaction) => [transaction.id, transaction]));
    const cloudTransactions = remoteTransactionSnapshots.docs.map((snapshot) => {
      const transaction = { ...snapshot.data(), id: snapshot.id };
      const localInvoice = localTransactionsById.get(transaction.id)?.invoice;
      return localInvoice ? { ...transaction, invoice: localInvoice } : transaction;
    });
    const mergedTransactions = new Map(cloudTransactions.map((transaction) => [transaction.id, transaction]));
    const localOnlyTransactions = [];

    for (const transaction of local.transactions) {
      if (!transaction?.id || mergedTransactions.has(transaction.id)) continue;
      mergedTransactions.set(transaction.id, transaction);
      localOnlyTransactions.push(transaction);
    }

    const data = remoteMetadata
      ? {
        transactions: [...mergedTransactions.values()],
        customCategories: remoteMetadata.customCategories || local.customCategories,
        monthlyGoalsByMonth: remoteMetadata.monthlyGoalsByMonth || local.monthlyGoalsByMonth,
        monthlyCategoryCapsByMonth: remoteMetadata.monthlyCategoryCapsByMonth || local.monthlyCategoryCapsByMonth,
        investmentRecords: remoteMetadata.investmentRecords || local.investmentRecords,
      }
      : local;

    // Solo creamos perfiles vacíos si NO son compartidos
    if (!remoteMetadata && !profile.id.includes('___')) {
      await saveInBatches([{
        reference: userProfile(user.uid, profile.id),
        data: profileMetadata(profile, data),
      }]);
    }

    await saveInBatches(localOnlyTransactions.map((transaction) => ({
      reference: userTransaction(user.uid, profile.id, transaction.id),
      data: transaction,
    })));

    writeLocalProfile(profile.id, data);
  }

  saveToLocalStorage(PROFILES_KEY, profiles);
  saveToLocalStorage(SYNC_OWNER_KEY, user.uid);
  const activeProfileId = profiles.some((profile) => profile.id === localActiveId)
    ? localActiveId
    : profiles[0].id;
  saveToLocalStorage(ACTIVE_PROFILE_KEY, activeProfileId);

  return {
    profiles,
    activeProfileId,
    ...readLocalProfile(activeProfileId),
  };
};

export const subscribeToProfiles = (uid, onChange, onError) =>
  onSnapshot(userProfiles(uid), (snapshot) => {
    const profiles = snapshot.docs.map((item) => ({
      id: item.id,
      name: item.data().name || 'Mi perfil',
    }));
    onChange(profiles);
  }, onError);

export const subscribeToProfile = (uid, profileId, onChange, onError) =>
  onSnapshot(userProfile(uid, profileId), (snapshot) => {
    if (snapshot.exists()) onChange(snapshot.data());
  }, onError);

export const subscribeToTransactions = (uid, profileId, onChange, onError) =>
  onSnapshot(userTransactions(uid, profileId), (snapshot) => {
    onChange(snapshot.docs.map((item) => ({ ...item.data(), id: item.id })));
  }, onError);

export const loadCloudProfileLocally = async (uid, profileId) => {
  const metadataSnapshot = await getDocs(userProfiles(uid));
  const profileMetadata = metadataSnapshot.docs.find((item) => item.id === profileId)?.data();
  if (!profileMetadata) return null;
  const transactionSnapshots = await getDocs(userTransactions(uid, profileId));
  const localTransactionsById = new Map(readLocalProfile(profileId).transactions.map((transaction) => [transaction.id, transaction]));
  const data = {
    transactions: transactionSnapshots.docs.map((item) => {
      const transaction = { ...item.data(), id: item.id };
      const localInvoice = localTransactionsById.get(transaction.id)?.invoice;
      return localInvoice ? { ...transaction, invoice: localInvoice } : transaction;
    }),
    customCategories: profileMetadata.customCategories || emptyProfileData.customCategories,
    monthlyGoalsByMonth: profileMetadata.monthlyGoalsByMonth || {},
    monthlyCategoryCapsByMonth: profileMetadata.monthlyCategoryCapsByMonth || {},
    investmentRecords: profileMetadata.investmentRecords || [],
  };
  writeLocalProfile(profileId, data);
  return data;
};

export const saveProfileToCloud = (uid, profile, data) =>
  saveInBatches([{
    reference: userProfile(uid, profile.id),
    data: profileMetadata(profile, data),
  }]);

export const deleteProfileFromCloud = async (uid, profileId) => {
  const transactions = await getDocs(userTransactions(uid, profileId));
  const writes = transactions.docs.map((transaction) => ({
    reference: transaction.ref,
    remove: true,
  }));
  writes.push({ reference: userProfile(uid, profileId), remove: true });
  await saveInBatches(writes);
};

export const saveTransactionsToCloud = async (uid, profileId, transactions) => {
  const current = await getDocs(userTransactions(uid, profileId));
  const currentIds = new Set(current.docs.map((item) => item.id));
  const nextIds = new Set(transactions.map((transaction) => transaction.id));
  const writes = transactions.map((transaction) => ({
    reference: userTransaction(uid, profileId, transaction.id),
    data: transaction,
  }));
  currentIds.forEach((id) => {
    if (!nextIds.has(id)) {
      writes.push({ reference: userTransaction(uid, profileId, id), remove: true });
    }
  });
  await saveInBatches(writes);
};

export const deleteTransactionsFromCloud = async (uid, profileId, transactionIds) =>
  saveInBatches(transactionIds.map((id) => ({
    reference: userTransaction(uid, profileId, id),
    remove: true,
  })));

export const saveTransactionToCloud = (uid, profileId, transaction) =>
  saveInBatches([{
    reference: userTransaction(uid, profileId, transaction.id),
    data: transaction,
  }]);

export const deleteTransactionFromCloud = (uid, profileId, transactionId) =>
  saveInBatches([{
    reference: userTransaction(uid, profileId, transactionId),
    remove: true,
  }]);