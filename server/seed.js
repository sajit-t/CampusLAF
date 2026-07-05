import { db } from './db.js';

const firstNames = [
  'Sajit', 'Sarah', 'Marcus', 'Alex', 'Emma', 'Olivia', 'Liam', 'Noah', 'Sophia', 'Jackson',
  'Mia', 'Lucas', 'Isabella', 'Ethan', 'Ava', 'Oliver', 'Charlotte', 'Aria', 'James', 'Amelia',
  'Benjamin', 'Harper', 'Evelyn', 'Henry', 'Ella', 'Michael', 'Sofia', 'Daniel', 'Avery', 'William',
  'Aravind', 'Bhavana', 'Chaitanya', 'Deepak', 'Ganesh', 'Hari', 'Ishwarya', 'Karthik', 'Lakshmi', 'Manoj',
  'Nisha', 'Pranav', 'Rahul', 'Siddharth', 'Tejas', 'Uma', 'Varun', 'Yash', 'Zoya', 'Divya'
];

const lastNames = [
  'Kumar', 'Chen', 'Miller', 'Rivers', 'Vance', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
  'Garcia', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Srinivasan', 'Patel',
  'Reddy', 'Sharma', 'Joshi', 'Rao', 'Nair', 'Iyer', 'Menon', 'Gupta', 'Mehta', 'Singh',
  'Choudhury', 'Sen', 'Das', 'Roy', 'Mukherjee', 'Chatterjee', 'Banerjee', 'Bose', 'Dutta', 'Pal'
];

const departments = [
  'Computer Science', 'Information Technology', 'Electrical & Electronics', 
  'Mechanical Engineering', 'Civil Engineering', 'Business Administration', 
  'Biotechnology', 'Physics'
];

const years = ['I Year', 'II Year', 'III Year', 'IV Year'];
const sections = ['A', 'B', 'C'];

// Unsplash profile pictures to make students look extremely realistic
const profilePics = [
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=150&q=80'
];

async function seed() {
  console.log('Starting Clean Seeding Process...');

  // 1. Create Default Student
  const studentRoll = '984512';
  let studentRecord = await db.students.findByRoll(studentRoll);
  if (!studentRecord) {
    studentRecord = await db.students.create({
      roll_number: studentRoll,
      register_number: '20260984512',
      full_name: 'Student',
      department: 'Computer Science',
      year: 'III Year',
      section: 'A',
      college_email: 'student@campus.edu',
      phone_number: '9876543210',
      profile_photo: profilePics[0],
      active_status: true
    });
    console.log('Created Student: Student');
  }

  // 2. Create Default Sarah student for matching
  const sarahRoll = '887213';
  let studentSarah = await db.students.findByRoll(sarahRoll);
  if (!studentSarah) {
    await db.students.create({
      roll_number: sarahRoll,
      register_number: '20260887213',
      full_name: 'Sarah Chen',
      department: 'Information Technology',
      year: 'III Year',
      section: 'B',
      college_email: 'schen@campus.edu',
      phone_number: '9876543211',
      profile_photo: profilePics[1],
      active_status: true
    });
    console.log('Created Student: Sarah Chen');
  }

  // 3. Create Marcus student
  const marcusRoll = '445123';
  let studentMarcus = await db.students.findByRoll(marcusRoll);
  if (!studentMarcus) {
    await db.students.create({
      roll_number: marcusRoll,
      register_number: '20260445123',
      full_name: 'Marcus Miller',
      department: 'Mechanical Engineering',
      year: 'IV Year',
      section: 'C',
      college_email: 'mmiller@campus.edu',
      phone_number: '9876543212',
      profile_photo: profilePics[2],
      active_status: true
    });
    console.log('Created Student: Marcus Miller');
  }

  // 4. Generate 600 realistic students
  console.log('Generating 600 dummy students...');
  let seededCount = 0;
  const emailsSet = new Set(['student@campus.edu', 'schen@campus.edu', 'mmiller@campus.edu']);
  const rollsSet = new Set([studentRoll, sarahRoll, marcusRoll]);
  const registersSet = new Set(['20260984512', '20260887213', '20260445123']);

  for (let i = 1; i <= 600; i++) {
    // Generate unique roll number
    let roll = '';
    do {
      roll = Math.floor(100000 + Math.random() * 900000).toString();
    } while (rollsSet.has(roll));
    rollsSet.add(roll);

    // Generate unique register number
    let reg = '';
    do {
      reg = '20260' + Math.floor(100000 + Math.random() * 900000).toString();
    } while (registersSet.has(reg));
    registersSet.add(reg);

    // Generate name
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${fn} ${ln}`;

    // Generate unique email
    let email = `${fn.toLowerCase()}.${ln.toLowerCase()}@campus.edu`;
    let attempts = 0;
    while (emailsSet.has(email)) {
      email = `${fn.toLowerCase()}.${ln.toLowerCase()}${Math.floor(Math.random() * 10)}@campus.edu`;
      attempts++;
      if (attempts > 5) break;
    }
    emailsSet.add(email);

    const dept = departments[Math.floor(Math.random() * departments.length)];
    const yr = years[Math.floor(Math.random() * years.length)];
    const sec = sections[Math.floor(Math.random() * sections.length)];
    const phone = Math.floor(6000000000 + Math.random() * 4000000000).toString();
    const pic = profilePics[Math.floor(Math.random() * profilePics.length)];

    await db.students.create({
      roll_number: roll,
      register_number: reg,
      full_name: name,
      department: dept,
      year: yr,
      section: sec,
      college_email: email,
      phone_number: phone,
      profile_photo: pic,
      active_status: true
    });

    seededCount++;
    if (seededCount % 100 === 0) {
      console.log(`Seeded ${seededCount} students...`);
    }
  }

  console.log('Seeding Complete! Student database populated successfully.');
  console.log(`Total students in database: ${seededCount + 3}`);
}

seed().catch(err => {
  console.error('Error during seeding:', err);
});
