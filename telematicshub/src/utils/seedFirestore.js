// ===== FIRESTORE DEMO DATA SEEDER =====
// Called automatically by DataContext when Firestore collections are empty.
// Populates all collections with the same demo data from fakeData.js.

import { doc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';
import {
  vehicles, alerts, drivers, maintenance,
  documents, recentTrips, fuelTrend, tripData, speedData,
} from '../data/fakeData';

async function batchWrite(collectionName, items) {
  const batch = writeBatch(db);
  items.forEach((item) => {
    const id  = item.id || String(Math.random()).slice(2);
    const ref = doc(collection(db, collectionName), id);
    batch.set(ref, item);
  });
  await batch.commit();
}

async function createDemoAccount(email, password, name, role) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), {
      name,
      email,
      phone: '+91 00000 00000',
      role,
      createdAt: new Date(),
    });
  } catch (err) {
    // Account may already exist — that's fine
    if (err.code !== 'auth/email-already-in-use') {
      console.warn(`Demo account ${email}:`, err.message);
    }
  }
}

export async function seedFirestore() {
  console.log('Seeding Firestore with demo data...');
  try {
    // Write all data collections
    await batchWrite('vehicles',    vehicles);
    await batchWrite('alerts',      alerts);
    await batchWrite('drivers',     drivers);
    await batchWrite('maintenance', maintenance);
    await batchWrite('documents',   documents);
    await batchWrite('trips',       recentTrips);
    await batchWrite('fuelTrend',   fuelTrend);
    await batchWrite('tripData',    tripData);
    await batchWrite('speedData',   speedData);

    // Create demo Firebase Auth accounts
    await createDemoAccount('owner@demo.com',  'demo1234', 'Demo Owner',  'owner');
    await createDemoAccount('driver@demo.com', 'demo1234', 'Demo Driver', 'driver');

    console.log('Firestore seeded successfully.');
    return true;
  } catch (err) {
    console.error('Seed error:', err);
    return false;
  }
}
