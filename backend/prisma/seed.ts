import bcrypt from "bcryptjs";
import { PrismaClient, Track, Role, ClassStatus, SubmissionStatus, SubmissionType, AnnouncementType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // wipe in dev only (safe for local/demo)
  await prisma.refreshToken.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.daySubmission.deleteMany();
  await prisma.programDay.deleteMany();
  await prisma.programState.deleteMany();
  await prisma.program.deleteMany();
  await prisma.user.deleteMany();

  const pinHash = (pin: string) => bcrypt.hash(pin, 12);
  const passwordHash = (pw: string) => bcrypt.hash(pw, 12);

  const stu1 = await prisma.user.create({
    data: {
      id: "stu1",
      email: "stu1@demo.techm4schools.local",
      passwordHash: await passwordHash("ChangeMe_Stu1_12345"),
      pinHash: await pinHash("1234"),
      name: "Aditya Sharma",
      grade: "Grade 9",
      track: Track.Robotics,
      role: Role.student,
      xp: 2840,
      level: 7,
      streak: 5,
      rank: 4,
      avatar: "AS",
      school: "DPS Hyderabad",
      badges: ["🔥", "💻", "🤖", "⭐"],
      completedTasks: []
    }
  });

  const stu2 = await prisma.user.create({
    data: {
      id: "stu2",
      email: "stu2@demo.techm4schools.local",
      passwordHash: await passwordHash("ChangeMe_Stu2_12345"),
      pinHash: await pinHash("1234"),
      name: "Priya Reddy",
      grade: "Grade 10",
      track: Track.AI,
      role: Role.student,
      xp: 3820,
      level: 9,
      streak: 9,
      rank: 2,
      avatar: "PR",
      school: "Alphores International",
      badges: ["🔥", "💻", "🧠", "⭐", "🏆"],
      completedTasks: []
    }
  });

  await prisma.user.create({
    data: {
      id: "men1",
      email: "men1@demo.techm4schools.local",
      passwordHash: await passwordHash("ChangeMe_Men1_12345"),
      pinHash: await pinHash("1234"),
      name: "Rahul Mentor",
      grade: "B.Tech",
      track: Track.Coding,
      role: Role.mentor,
      xp: 9999,
      level: 20,
      streak: 30,
      rank: 1,
      avatar: "RM",
      school: "TechM4Schools",
      badges: ["👨‍🏫", "🏆", "🌟"],
      completedTasks: []
    }
  });

  await prisma.user.create({
    data: {
      id: "adm1",
      email: "admin@demo.techm4schools.local",
      passwordHash: await passwordHash("ChangeMe_Admin_12345"),
      pinHash: await pinHash("1234"),
      name: "Admin",
      grade: "Staff",
      track: Track.Innovation,
      role: Role.admin,
      xp: 0,
      level: 1,
      streak: 0,
      rank: 0,
      avatar: "AD",
      school: "TechM4Schools",
      badges: [],
      completedTasks: []
    }
  });

  // Classes (using the same titles/topics)
  await prisma.classSession.createMany({
    data: [
      { id: "c1", day: 1, title: "Orientation & Lab Setup", trackAll: true, topic: "Welcome to TechM4Schools Summer Bootcamp 2025", time: "9:00 AM – 11:00 AM", mentor: "Rahul Sir", status: ClassStatus.done, objectives: ["Meet your team", "Understand bootcamp structure", "Set up workstations", "Safety protocols"], materials: ["Bootcamp handbook", "Lab safety guide"] },
      { id: "c2", day: 2, title: "Electronics Fundamentals", track: Track.Robotics, trackAll: false, topic: "Ohm's Law, Circuits & Arduino IDE Setup", time: "9:00 AM – 12:00 PM", mentor: "Pradeep Sir", status: ClassStatus.done, objectives: ["Understand voltage, current, resistance", "Set up Arduino IDE", "First blink program", "Breadboard basics"], materials: ["Arduino Uno", "USB cable", "LED", "Resistors", "Breadboard"] },
      { id: "c3", day: 3, title: "HTML & CSS Crash Course", track: Track.Coding, trackAll: false, topic: "Building your first webpage from scratch", time: "9:00 AM – 12:00 PM", mentor: "Sneha Ma'am", status: ClassStatus.done, objectives: ["HTML structure", "CSS styling", "Responsive basics", "Deploy to GitHub"], materials: ["Laptop", "VS Code", "GitHub account"] },
      { id: "c4", day: 4, title: "Drone Anatomy & Physics", track: Track.Drone, trackAll: false, topic: "How drones fly — thrust, lift, physics of flight", time: "9:00 AM – 12:00 PM", mentor: "Vikram Sir", status: ClassStatus.done, objectives: ["Drone parts identification", "Physics of quadcopter flight", "Safety rules", "Pre-flight checklist"], materials: ["Drone kit", "Safety glasses", "Pre-flight checklist sheet"] },
      { id: "c5", day: 5, title: "Python for AI", track: Track.AI, trackAll: false, topic: "Variables, loops, functions — the building blocks", time: "9:00 AM – 12:00 PM", mentor: "Ananya Ma'am", status: ClassStatus.done, objectives: ["Python syntax basics", "Data types", "Control flow", "First ML-ready script"], materials: ["Laptop", "Python 3 installed", "Jupyter notebook"] },
      { id: "c6", day: 6, title: "Design Thinking Workshop", track: Track.Innovation, trackAll: false, topic: "From problem to prototype in one day", time: "9:00 AM – 12:00 PM", mentor: "Ravi Sir", status: ClassStatus.done, objectives: ["Problem framing", "User empathy", "Rapid ideation", "Paper prototype"], materials: ["Sticky notes", "Markers", "Paper", "Feedback cards"] },
      { id: "c7", day: 7, title: "Arduino Servo & Sensors", track: Track.Robotics, trackAll: false, topic: "Controlling servo motors with HC-SR04 ultrasonic sensor", time: "9:00 AM – 12:00 PM", mentor: "Pradeep Sir", status: ClassStatus.live, objectives: ["Wire servo motor to Uno", "Read ultrasonic distance", "Obstacle-avoiding logic", "Serial monitor debugging"], materials: ["Arduino Uno", "Servo motor", "HC-SR04 sensor", "Jumper wires", "Breadboard"] },
      { id: "c8", day: 8, title: "JavaScript & DOM Manipulation", track: Track.Coding, trackAll: false, topic: "Making pages interactive with vanilla JS", time: "9:00 AM – 12:00 PM", mentor: "Sneha Ma'am", status: ClassStatus.upcoming, objectives: ["Event listeners", "DOM manipulation", "Fetch API basics", "Build a live quiz app"], materials: ["Laptop", "Browser DevTools"] },
      { id: "c9", day: 9, title: "First Drone Flight", track: Track.Drone, trackAll: false, topic: "Indoor hover, yaw, pitch, roll — controlled flying", time: "9:00 AM – 12:00 PM", mentor: "Vikram Sir", status: ClassStatus.upcoming, objectives: ["Pre-flight check", "Indoor hover test", "Basic manoeuvres", "Record footage"], materials: ["Drone kit", "Spare props", "Safety nets", "GoPro"] },
      { id: "c10", day: 10, title: "Machine Learning Basics", track: Track.AI, trackAll: false, topic: "Supervised learning, datasets, training your first model", time: "9:00 AM – 12:00 PM", mentor: "Ananya Ma'am", status: ClassStatus.upcoming, objectives: ["What is ML?", "scikit-learn intro", "Train/test split", "Accuracy metrics"], materials: ["Laptop", "Google Colab", "Dataset CSV"] },
      { id: "c11", day: 15, title: "Mid-Bootcamp Hackathon", trackAll: true, topic: "48-hour cross-track team challenge", time: "All Day", mentor: "All Mentors", status: ClassStatus.upcoming, objectives: ["Form cross-track teams", "Build working prototype", "Present to judges", "Win prizes"], materials: ["All lab resources", "3D pen", "Arduino kits"] },
      { id: "c12", day: 30, title: "🎓 Demo Day & Graduation", trackAll: true, topic: "Showcase your 30-day project to parents & industry guests", time: "10:00 AM – 6:00 PM", mentor: "All Mentors", status: ClassStatus.upcoming, objectives: ["Live project demos", "Certificate ceremony", "Alumni network launch", "Celebration!"], materials: ["Your project", "Presentation slides", "Parent invite"] }
    ]
  });

  await prisma.submission.createMany({
    data: [
      { id: "s1", studentId: stu1.id, track: Track.Robotics, title: "LED Blink Program", type: SubmissionType.code, status: SubmissionStatus.approved, score: 95, feedback: "Excellent work! Clean code and proper comments. Try PWM next!", fileType: "Arduino (.ino)", xpAwarded: 100, submittedAt: new Date() },
      { id: "s2", studentId: stu1.id, track: Track.Robotics, title: "Breadboard Circuit Assembly", type: SubmissionType.assembly, status: SubmissionStatus.approved, score: 88, feedback: "Good circuit! Check your ground connections next time.", fileType: "Photo (JPG)", xpAwarded: 75, submittedAt: new Date() },
      { id: "s3", studentId: stu1.id, track: Track.Robotics, title: "Servo Motor Control", type: SubmissionType.code, status: SubmissionStatus.pending, fileType: "Arduino (.ino)", submittedAt: new Date() },
      { id: "s4", studentId: stu2.id, track: Track.AI, title: "Python Score Calculator", type: SubmissionType.code, status: SubmissionStatus.approved, score: 100, feedback: "Perfect! Can you extend this to plot a histogram?", fileType: "Python (.py)", xpAwarded: 130, submittedAt: new Date() },
      { id: "s5", studentId: stu2.id, track: Track.AI, title: "Obstacle Avoider (Team)", type: SubmissionType.assembly, status: SubmissionStatus.needs_revision, feedback: "Ultrasonic sensor not reading correctly. Check wiring of TRIG pin.", fileType: "Video (MP4)", submittedAt: new Date() }
    ]
  });

  await prisma.announcement.createMany({
    data: [
      { id: "a1", type: AnnouncementType.urgent, title: "⚡ Demo Day Registration Open!", body: "Register your project before May 25. All tracks must submit a project title and 2-line description to their mentor.", dateLabel: "Today · 9:00 AM", pinned: true },
      { id: "a2", type: AnnouncementType.info, title: "Arduino IDE Update — Download v2.3.2", body: "Update your Arduino IDE to v2.3.2. New features: better Serial Monitor, auto-format shortcut Ctrl+T, improved board manager.", dateLabel: "Today · 8:30 AM", pinned: false },
      { id: "a3", type: AnnouncementType.event, title: "🏆 Mid-Bootcamp Hackathon — Day 15", body: "48-hour hackathon! Form cross-track teams of 4. Theme revealed Day 14 evening. Top 3 teams win special maker kits.", dateLabel: "Yesterday", pinned: false },
      { id: "a4", type: AnnouncementType.achievement, title: "🥇 Week 1 Results Announced", body: "Congrats Arjun Reddy (1st), Priya Sharma (2nd), Rishi Kumar (3rd)! Week 2 resets Day 8. Keep building!", dateLabel: "2 days ago", pinned: false },
      { id: "a5", type: AnnouncementType.info, title: "Drone Track — Outdoor Session Day 9", body: "Day 9 Drone session moved outdoors to school grounds. Wear comfortable shoes, bring your kit and water bottle.", dateLabel: "3 days ago", pinned: false }
    ]
  });

  // 25-day program (from handbook)
  const program = await prisma.program.create({
    data: {
      id: "prog_2026_25d",
      name: "TechM4Schools — 25-Day AI-Powered Experiential Learning Programme",
      year: 2026,
      totalDays: 25,
      state: {
        create: {
          startDate: new Date(),
          currentDayOverride: 1,
          timezone: "Asia/Kolkata"
        }
      }
    }
  });

  const days = [
    { dayNumber: 1, phase: 1, topic: "Introduction to AI as a Learning Tool", aiFocus: "What is AI? Write your first 10 prompts. Role prompting basics.", kitExperiment: "No kit today — explore ChatGPT/Gemini and try 3 AI tools.", dailyAssignment: "Submit: your 5 best prompts + 1 paragraph on what surprised you most about AI", trackTags: ["Prompt Engineering"] },
    { dayNumber: 2, phase: 1, topic: "Prompt Engineering Deep Dive", aiFocus: "Context prompting, chain prompting, persona prompting, structured output prompting.", kitExperiment: "Use AI to generate your personalised 25-day learning schedule.", dailyAssignment: "Submit: AI-generated 25-day plan + 3 prompt strategies you discovered", trackTags: ["Prompt Engineering"] },
    { dayNumber: 3, phase: 1, topic: "Python Programming with AI", aiFocus: "Ask AI to teach Python basics and debug errors.", kitExperiment: "Write 3 Python programs with AI: calculator, quiz, number guessing.", dailyAssignment: "Submit: 3 working Python programs + 60-second voice note explaining each", trackTags: ["Python"] },
    { dayNumber: 4, phase: 1, topic: "Web Development with AI", aiFocus: "Ask AI to build a personal HTML/CSS webpage step-by-step.", kitExperiment: "Build your personal webpage and view it on phone/laptop.", dailyAssignment: "Submit: screenshot of webpage + share link in community", trackTags: ["Web Dev"] },
    { dayNumber: 5, phase: 1, topic: "PHASE 1 MILESTONE — Python Meets Web", aiFocus: "Ask AI: How can Python generate HTML? Guide the full project.", kitExperiment: "Build Python script that generates a personalised HTML report card.", dailyAssignment: "Submit: 90s demo video showing output + explaining build", trackTags: ["Python", "Web Dev"] },
    { dayNumber: 6, phase: 2, topic: "IoT — Arduino & Circuits", aiFocus: "Ask AI: What is Arduino? How do circuits work? Generate blink code.", kitExperiment: "Connect an LED to Arduino Nano and blink it.", dailyAssignment: "Submit: 30s video of blinking LED + screenshot of AI conversation used", trackTags: ["IoT"] },
    { dayNumber: 7, phase: 2, topic: "IoT — Sensors & Real Data", aiFocus: "Ask AI to explain sensors; generate reading + display code.", kitExperiment: "Connect temperature sensor; read live data; display in Serial Monitor.", dailyAssignment: "Submit: screenshot of live sensor data + explain what each line does", trackTags: ["IoT"] },
    { dayNumber: 8, phase: 2, topic: "AI & Machine Learning", aiFocus: "Ask AI: What is ML? How does a model learn from data?", kitExperiment: "Use Teachable Machine to train an image classifier.", dailyAssignment: "Submit: model link + explain 3 things it can recognise", trackTags: ["AI/ML"] },
    { dayNumber: 9, phase: 2, topic: "Space Technology — CanSat", aiFocus: "Ask AI to explain CanSat missions; write a mission brief.", kitExperiment: "Assemble CanSat model; attach temperature sensor component.", dailyAssignment: "Submit: assembly photo + AI-generated mission brief", trackTags: ["Space Tech", "IoT"] },
    { dayNumber: 10, phase: 2, topic: "Drone Technology", aiFocus: "Ask AI: flight physics, PID, autonomous navigation.", kitExperiment: "Use drone simulator; fly a simple programmed path.", dailyAssignment: "Submit: simulation screenshot + Python flight path code", trackTags: ["Drone"] },
    { dayNumber: 11, phase: 2, topic: "MERN Stack — React Basics", aiFocus: "Ask AI to explain React components/JSX and frontend-backend.", kitExperiment: "Set up React app; build interactive To-Do list with AI help.", dailyAssignment: "Submit: screenshot of running React app + voice note about one component", trackTags: ["Web Dev"] },
    { dayNumber: 12, phase: 2, topic: "PHASE 2 MILESTONE — IoT Meets Web", aiFocus: "Ask AI for end-to-end: Arduino sensor → Python → HTML display.", kitExperiment: "Read Arduino sensor via Python and show on a live webpage.", dailyAssignment: "Submit: live demo video showing sensor reading on webpage", trackTags: ["IoT", "Web Dev", "Python"] },
    { dayNumber: 13, phase: 3, topic: "Full Stack Architecture", aiFocus: "Ask AI to design architecture: DB, API, frontend, hardware.", kitExperiment: "Draw your product architecture diagram using AI guidance.", dailyAssignment: "Submit: architecture diagram + AI conversation log", trackTags: ["Architecture"] },
    { dayNumber: 14, phase: 3, topic: "Backend + Database", aiFocus: "Ask AI to write a backend and explain each route.", kitExperiment: "Build an API with 3 endpoints and test them.", dailyAssignment: "Submit: API running + explanation of each endpoint", trackTags: ["Backend"] },
    { dayNumber: 15, phase: 3, topic: "AI Feature Integration", aiFocus: "Ask AI to integrate OpenAI/Gemini API into your web app.", kitExperiment: "Add an AI feature: chatbot / classifier / analyser.", dailyAssignment: "Submit: screenshot showing AI feature working live", trackTags: ["AI/ML", "Web Dev"] },
    { dayNumber: 16, phase: 3, topic: "IoT Live Dashboard", aiFocus: "Ask AI for pipeline: Arduino sensor → script → web dashboard.", kitExperiment: "Wire sensor; read data; display live on browser dashboard.", dailyAssignment: "Submit: 90s video of live sensor data updating", trackTags: ["IoT", "Web Dev"] },
    { dayNumber: 17, phase: 3, topic: "Drone Autonomous Mission", aiFocus: "Ask AI to design route + generate simulation code.", kitExperiment: "Program simulator to follow route and avoid an obstacle.", dailyAssignment: "Submit: simulation video + code", trackTags: ["Drone", "AI/ML"] },
    { dayNumber: 18, phase: 3, topic: "Space Tech Data Analysis", aiFocus: "Ask AI for data logging script + analysis report.", kitExperiment: "Simulate 10-minute mission; collect telemetry.", dailyAssignment: "Submit: mission CSV + AI-generated analysis report", trackTags: ["Space Tech", "Data"] },
    { dayNumber: 19, phase: 3, topic: "Data Visualisation", aiFocus: "Ask AI to generate charting code from real data.", kitExperiment: "Build a chart page in your web app using collected data.", dailyAssignment: "Submit: screenshot of chart page with real data", trackTags: ["Data", "Web Dev"] },
    { dayNumber: 20, phase: 3, topic: "PHASE 3 MILESTONE — Integrated Product Demo", aiFocus: "AI used for every layer: frontend, backend, AI, debugging.", kitExperiment: "Combine web app + IoT live data + AI feature + charts.", dailyAssignment: "Submit: 3-minute demo video showing every feature", trackTags: ["Integration"] },
    { dayNumber: 21, phase: 4, topic: "Product Ideation Day", aiFocus: "Ask AI to validate product idea, user, and feature list.", kitExperiment: "Write product brief using AI template.", dailyAssignment: "Submit: one-pager (problem, solution, user, features, tech stack)", trackTags: ["Product"] },
    { dayNumber: 22, phase: 4, topic: "Build Sprint — Frontend + AI", aiFocus: "AI helps write UI code and AI integration from prompts.", kitExperiment: "Build frontend pages and AI feature; test it.", dailyAssignment: "Submit: live link/screenshot + voice note on UX", trackTags: ["Web Dev", "AI/ML"] },
    { dayNumber: 23, phase: 4, topic: "Build Sprint — Backend + IoT", aiFocus: "AI generates/debugs backend and hardware integration.", kitExperiment: "Connect IoT hardware and link to backend end-to-end.", dailyAssignment: "Submit: video showing physical data flowing to web app", trackTags: ["Backend", "IoT"] },
    { dayNumber: 24, phase: 4, topic: "Testing, Debugging & Documentation", aiFocus: "Ask AI to review for bugs/security and write report.", kitExperiment: "Fix critical bugs; write project report; record demo.", dailyAssignment: "Submit: bug-fixed code + report + 3–5 min demo video", trackTags: ["QA", "Docs"] },
    { dayNumber: 25, phase: 4, topic: "FINAL SUBMISSION DAY", aiFocus: "Finalize and prove understanding with complete portfolio.", kitExperiment: "No new building. Finalise and upload everything.", dailyAssignment: "FINAL: code repo + demo video + report + prompt log + voice explanation", trackTags: ["Final"] }
  ] as const;

  await prisma.programDay.createMany({
    data: days.map((d) => ({
      programId: program.id,
      dayNumber: d.dayNumber,
      topic: d.topic,
      aiFocus: d.aiFocus,
      kitExperiment: d.kitExperiment,
      dailyAssignment: d.dailyAssignment,
      phase: d.phase,
      trackTags: [...d.trackTags]
    }))
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

