const admin = require('firebase-admin');
const serviceAccount = require('./models/serviceAccountKey.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

const usersToSeed = [
  { name: "Dr. Ephantus Mwangi", email: "ephantus@sala.ac.ke", password: "admin123", role: "admin", regNumber: "STAFF001", enrolledSubjects: [] },
  { name: "Ian Muriithi", email: "ian.muriithi@sala.ac.ke", password: "password123", role: "student", regNumber: "PA106/G/17497/22", enrolledSubjects: ['algo','net','db'] },
  { name: "Brian Kiptonui", email: "brian.kiptonui@sala.ac.ke", password: "password123", role: "student", regNumber: "CT101/G/16060/22", enrolledSubjects: ['sec','ai','ds'] },
  { name: "Amos Njuguna", email: "amos.njuguna@sala.ac.ke", password: "password123", role: "student", regNumber: "CT101/G/8435/20", enrolledSubjects: ['sec','math','mob','os'] },
  { name: "Joyce Wanjiku", email: "joyce.wanjiku@sala.ac.ke", password: "password123", role: "student", regNumber: "CT102/G/16083/22", enrolledSubjects: ['cloud','oop','stat'] }
];

async function seedDatabase() {
  console.log(`Starting to seed ${usersToSeed.length} users into Firebase...\n`);
  let successCount = 0;

  for (const user of usersToSeed) {
    try {
      console.log(`Creating account for ${user.name}...`);
      
      const userRecord = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.name,
      });

    
      await db.collection('users').doc(userRecord.uid).set({
        name: user.name,
        email: user.email,
        role: user.role,
        regNumber: user.regNumber,
        enrolledSubjects: user.enrolledSubjects,
        bkt_profile: {}, 
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Success! UID: ${userRecord.uid}`);
      successCount++;
      
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️ Skipped: ${user.email} already exists in the database.`);
      } else {
        console.error(`❌ Error creating ${user.name}:`, error.message);
      }
    }
  }

  console.log(`\n🎉 SEED COMPLETE! Added ${successCount} users.`);
  process.exit(0);
}

seedDatabase();