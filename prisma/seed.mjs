import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
});

const STORAGE_ROOT = path.join(process.cwd(), "storage", "team-files");
const DEFAULT_PASSWORD = "Passw0rd!";
const now = new Date();

function daysFromNow(days) {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

async function resetStorage() {
  await rm(STORAGE_ROOT, { recursive: true, force: true });
  await mkdir(STORAGE_ROOT, { recursive: true });
}

async function resetDatabase() {
  await prisma.session.deleteMany();
  await prisma.score.deleteMany();
  await prisma.teamFile.deleteMany();
  await prisma.task.deleteMany();
  await prisma.inviteCode.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();
}

async function createUsers() {
  const passwordHash = await hash(DEFAULT_PASSWORD, 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: "teacher01",
        displayName: "Prof. Lin",
        role: "TEACHER",
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        username: "leader01",
        displayName: "Chen Yifan",
        role: "LEADER",
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        username: "leader02",
        displayName: "Zhao Xinyue",
        role: "LEADER",
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        username: "leader03",
        displayName: "Liu Haoran",
        role: "LEADER",
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        username: "member01",
        displayName: "Wang Rui",
        role: "MEMBER",
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        username: "member02",
        displayName: "Sun Jiaqi",
        role: "MEMBER",
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        username: "member03",
        displayName: "Xu Ming",
        role: "MEMBER",
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        username: "member04",
        displayName: "He Zimo",
        role: "MEMBER",
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        username: "member05",
        displayName: "Tang Xuan",
        role: "MEMBER",
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        username: "member06",
        displayName: "Guo Yutong",
        role: "MEMBER",
        passwordHash,
      },
    }),
  ]);

  return {
    teacher: users[0],
    leaders: users.slice(1, 4),
    members: users.slice(4),
  };
}

async function createTeams({ leaders, members }) {
  const teams = await Promise.all([
    prisma.team.create({
      data: {
        id: "seed-team-smart-recycle",
        name: "SmartRecycle Hub",
        description: "Campus recycling service with pickup scheduling and incentive points.",
        leaderId: leaders[0].id,
      },
    }),
    prisma.team.create({
      data: {
        id: "seed-team-classpulse",
        name: "ClassPulse",
        description: "Lightweight class engagement dashboard for teachers and teaching assistants.",
        leaderId: leaders[1].id,
      },
    }),
    prisma.team.create({
      data: {
        id: "seed-team-nightbite",
        name: "NightBite",
        description: "Late-night student meal preorder service around dormitory areas.",
        leaderId: leaders[2].id,
      },
    }),
  ]);

  const membershipPlan = [
    { teamId: teams[0].id, userId: leaders[0].id },
    { teamId: teams[0].id, userId: members[0].id },
    { teamId: teams[0].id, userId: members[1].id },
    { teamId: teams[1].id, userId: leaders[1].id },
    { teamId: teams[1].id, userId: members[2].id },
    { teamId: teams[1].id, userId: members[3].id },
    { teamId: teams[2].id, userId: leaders[2].id },
    { teamId: teams[2].id, userId: members[4].id },
    { teamId: teams[2].id, userId: members[5].id },
  ];

  await prisma.teamMember.createMany({
    data: membershipPlan,
  });

  await prisma.inviteCode.createMany({
    data: [
      {
        code: "RECYCLE-2026",
        teamId: teams[0].id,
        createdById: leaders[0].id,
        isActive: true,
        maxUses: 50,
        usedCount: 2,
        expiresAt: daysFromNow(14),
      },
      {
        code: "PULSE-2026",
        teamId: teams[1].id,
        createdById: leaders[1].id,
        isActive: true,
        maxUses: 50,
        usedCount: 2,
        expiresAt: daysFromNow(10),
      },
      {
        code: "NIGHTBITE-2026",
        teamId: teams[2].id,
        createdById: leaders[2].id,
        isActive: true,
        maxUses: 50,
        usedCount: 2,
        expiresAt: daysFromNow(7),
      },
    ],
  });

  return teams;
}

async function createTasks({ teams, leaders, members }) {
  await prisma.task.createMany({
    data: [
      {
        teamId: teams[0].id,
        title: "Confirm dormitory pickup flow",
        description: "Interview 8 students and map the current recycling handoff process.",
        objective: "Validate whether pickup scheduling solves a real pain point.",
        acceptanceCriteria:
          "Complete 8 interview notes\nSummarize 3 repeated pain points\nUpdate process map in the pitch deck",
        nextActions:
          "Book interview slots\nCollect screenshots of current group chat flow\nReview findings with leader",
        risks: "Students may not respond before the weekend.",
        deliverables: "Interview summary\nCurrent-state flowchart",
        collaborationNote: "Share interview notes in the team drive before Monday standup.",
        priority: "High",
        status: "DONE",
        creatorId: leaders[0].id,
        assigneeId: members[0].id,
        dueDate: daysFromNow(-3),
      },
      {
        teamId: teams[0].id,
        title: "Prepare pilot cost estimate",
        description: "Estimate bags, transport, and reward-point costs for a 4-week pilot.",
        objective: "Produce a defendable operating cost table for the business plan.",
        acceptanceCriteria:
          "List all line items\nAttach assumptions\nReview numbers with the team leader",
        nextActions:
          "Check market prices\nCompare 2 logistics options\nDraft final table in spreadsheet",
        risks: "Supplier quotes may vary by a large margin.",
        deliverables: "Cost estimate sheet",
        collaborationNote: "Flag any assumption above 10% uncertainty.",
        priority: "High",
        status: "IN_PROGRESS",
        creatorId: leaders[0].id,
        assigneeId: members[1].id,
        dueDate: daysFromNow(2),
      },
      {
        teamId: teams[0].id,
        title: "Refine landing page copy",
        description: "Rewrite homepage message for the first round of user testing.",
        objective: "Improve clarity of value proposition in under 15 seconds.",
        acceptanceCriteria:
          "Headline updated\nThree benefit bullets rewritten\nTeacher feedback incorporated",
        nextActions: "Draft A/B copy\nRun quick review with classmates",
        risks: "Copy may be too broad and lose the eco-service focus.",
        deliverables: "Updated landing page text",
        collaborationNote: "Coordinate wording with the presentation owner.",
        priority: "Medium",
        status: "TODO",
        creatorId: leaders[0].id,
        assigneeId: leaders[0].id,
        dueDate: daysFromNow(4),
      },
      {
        teamId: teams[1].id,
        title: "整理课堂活跃度指标",
        description: "明确教师端要展示的 5 个核心课堂参与指标。",
        objective: "让评分和过程管理页的数据口径一致。",
        acceptanceCriteria:
          "指标定义完成\n口径与老师确认\n输出指标说明文档",
        nextActions:
          "Review sample class records\nConfirm formula with teacher\nWrite dashboard notes",
        risks: "Different course types may need different weight settings.",
        deliverables: "Metric definition sheet",
        collaborationNote: "Keep metric names aligned with the UI draft.",
        priority: "High",
        status: "DONE",
        creatorId: leaders[1].id,
        assigneeId: members[2].id,
        dueDate: daysFromNow(-2),
      },
      {
        teamId: teams[1].id,
        title: "Finish teacher dashboard prototype",
        description: "Complete the second iteration of the teacher-side summary view.",
        objective: "Support classroom demo with a realistic end-to-end workflow.",
        acceptanceCriteria:
          "Overview cards complete\nAlert area complete\nDemo script updated",
        nextActions:
          "Polish chart layout\nReview interaction text\nCheck mobile width",
        risks: "Prototype may become too dense for live presentation.",
        deliverables: "Interactive dashboard prototype",
        collaborationNote: "Record all UI changes in the design handoff note.",
        priority: "High",
        status: "IN_PROGRESS",
        creatorId: leaders[1].id,
        assigneeId: leaders[1].id,
        dueDate: daysFromNow(1),
      },
      {
        teamId: teams[1].id,
        title: "Draft business model slide",
        description: "Summarize customer segment, pricing, and rollout assumptions.",
        objective: "Make the defense deck easier to explain in 2 minutes.",
        acceptanceCriteria:
          "Customer segment clear\nPricing assumption shown\nRollout path listed",
        nextActions: "Collect references\nDraft v1 slide\nPeer review with teammate",
        risks: "Financial assumption may still need stronger justification.",
        deliverables: "Business model slide",
        collaborationNote: "Reuse phrasing from the market analysis section where possible.",
        priority: "Medium",
        status: "TODO",
        creatorId: leaders[1].id,
        assigneeId: members[3].id,
        dueDate: daysFromNow(3),
      },
      {
        teamId: teams[2].id,
        title: "Verify late-night demand window",
        description: "Collect cafeteria and dorm traffic observations from 20:00 to 23:00.",
        objective: "Confirm order peaks for the preorder service.",
        acceptanceCriteria:
          "Observation notes complete\nPeak time range identified\nFindings synced to board",
        nextActions:
          "Split observation shifts\nTake anonymized count notes\nCompare weekday vs weekend",
        risks: "Rainy weather may distort actual demand.",
        deliverables: "Demand observation memo",
        collaborationNote: "Upload photos and count sheet to the team file area.",
        priority: "High",
        status: "DONE",
        creatorId: leaders[2].id,
        assigneeId: members[4].id,
        dueDate: daysFromNow(-4),
      },
      {
        teamId: teams[2].id,
        title: "Complete vendor shortlist",
        description: "筛选 3 家适合宿舍夜宵配送的合作商户。",
        objective: "为商业模式和履约方案提供真实支撑。",
        acceptanceCriteria:
          "3 家商户信息完整\n合作条件对比完成\n推荐结论清晰",
        nextActions:
          "Call nearby stores\nDocument delivery radius\nSummarize margin estimate",
        risks: "商户报价可能在考试周前后波动。",
        deliverables: "Vendor comparison table",
        collaborationNote: "Highlight any constraint affecting delivery SLA.",
        priority: "High",
        status: "IN_PROGRESS",
        creatorId: leaders[2].id,
        assigneeId: members[5].id,
        dueDate: daysFromNow(2),
      },
      {
        teamId: teams[2].id,
        title: "Record final pitch rehearsal",
        description: "Run one timed rehearsal and record the full session.",
        objective: "Reduce timing risk before final classroom presentation.",
        acceptanceCriteria:
          "Full video recorded\nOvertime sections marked\nAction list created",
        nextActions: "Book room\nRun rehearsal\nCapture revision list",
        risks: "Some members may still miss transitions between sections.",
        deliverables: "Rehearsal video\nRevision checklist",
        collaborationNote: "Upload the final checklist to team files after rehearsal.",
        priority: "Medium",
        status: "TODO",
        creatorId: leaders[2].id,
        assigneeId: leaders[2].id,
        dueDate: daysFromNow(5),
      },
    ],
  });
}

async function createAnnouncements({ teacher, leaders }) {
  await prisma.announcement.createMany({
    data: [
      {
        title: "Week 8 presentation checklist",
        content:
          "Each team should finalize the board status, upload its latest deck, and rehearse once before Friday 18:00.",
        authorId: teacher.id,
      },
      {
        title: "Teacher feedback window updated",
        content:
          "The teacher will review business model slides tomorrow afternoon. Please keep your newest version in the team files area.",
        authorId: teacher.id,
      },
      {
        title: "SmartRecycle field notes uploaded",
        content:
          "Interview notes and user pain-point summary are ready. Team members can now continue with cost estimation and copy updates.",
        authorId: leaders[0].id,
      },
      {
        title: "ClassPulse prototype review at 20:30",
        content:
          "We will do a quick dashboard walkthrough tonight and freeze the layout before tomorrow's feedback session.",
        authorId: leaders[1].id,
      },
      {
        title: "NightBite vendor research split",
        content:
          "Two teammates will handle store calls, and one teammate will consolidate pricing and delivery radius into the comparison sheet.",
        authorId: leaders[2].id,
      },
    ],
  });
}

async function createScores({ teacher, teams }) {
  await prisma.score.createMany({
    data: [
      {
        teamId: teams[0].id,
        teacherId: teacher.id,
        businessPlanScore: 54,
        defenseScore: 25,
        bonusScore: 6,
        comment:
          "Problem definition is clear and field interviews are convincing. Strengthen the pilot cost assumptions before the final defense.",
      },
      {
        teamId: teams[1].id,
        teacherId: teacher.id,
        businessPlanScore: 57,
        defenseScore: 27,
        bonusScore: 8,
        comment:
          "Teacher-side value is articulated well. The dashboard story is coherent and close to final-demo quality.",
      },
      {
        teamId: teams[2].id,
        teacherId: teacher.id,
        businessPlanScore: 52,
        defenseScore: 24,
        bonusScore: 5,
        comment:
          "Demand observation is useful. Vendor comparison still needs stronger margin explanation and clearer delivery assumptions.",
      },
    ],
  });
}

async function createFiles({ teams, leaders, members }) {
  const filePlan = [
    {
      teamId: teams[0].id,
      uploaderId: members[1].id,
      originalName: "smartrecycle-cost-estimate.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      content:
        "Week 8 cost estimate draft\n- pickup labor\n- bags and labels\n- dormitory incentive points\n- transport reserve",
    },
    {
      teamId: teams[0].id,
      uploaderId: leaders[0].id,
      originalName: "smartrecycle-user-interviews.md",
      mimeType: "text/markdown",
      content:
        "# SmartRecycle user interviews\n\n1. Students want a predictable pickup time.\n2. Incentive points increase willingness to sort materials.",
    },
    {
      teamId: teams[1].id,
      uploaderId: leaders[1].id,
      originalName: "classpulse-dashboard-wireframe.pdf",
      mimeType: "application/pdf",
      content:
        "ClassPulse dashboard wireframe placeholder for local demo.\nOverview cards, alert section, and weekly participation trend.",
    },
    {
      teamId: teams[1].id,
      uploaderId: members[2].id,
      originalName: "classpulse-metrics-notes.txt",
      mimeType: "text/plain",
      content:
        "Core metrics: attendance completion, discussion participation, assignment on-time rate, quiz completion, weekly risk alert.",
    },
    {
      teamId: teams[2].id,
      uploaderId: members[5].id,
      originalName: "nightbite-vendor-comparison.csv",
      mimeType: "text/csv",
      content:
        "vendor,delivery_radius_km,avg_margin,open_until\nStore A,1.5,0.28,23:30\nStore B,2.0,0.25,24:00\nStore C,1.2,0.32,23:00",
    },
    {
      teamId: teams[2].id,
      uploaderId: leaders[2].id,
      originalName: "nightbite-rehearsal-plan.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      content:
        "NightBite rehearsal outline\n1. Opening problem statement\n2. Demand evidence\n3. Vendor shortlist\n4. Delivery model\n5. Q&A handoff",
    },
  ];

  for (const item of filePlan) {
    const teamDir = path.join(STORAGE_ROOT, item.teamId);
    await mkdir(teamDir, { recursive: true });
    const storedName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${item.originalName}`;
    const relativePath = path.posix.join(item.teamId, storedName);
    await writeFile(path.join(teamDir, storedName), item.content);

    await prisma.teamFile.create({
      data: {
        teamId: item.teamId,
        uploaderId: item.uploaderId,
        originalName: item.originalName,
        storedName,
        mimeType: item.mimeType,
        size: Buffer.byteLength(item.content),
        relativePath,
      },
    });
  }
}

async function main() {
  await resetStorage();
  await resetDatabase();

  const users = await createUsers();
  const teams = await createTeams(users);

  await createTasks({ teams, ...users });
  await createAnnouncements(users);
  await createScores({ teacher: users.teacher, teams });
  await createFiles({ teams, ...users });

  console.log("Seed completed with realistic classroom demo data.");
  console.log("Teacher login: teacher01 / Passw0rd!");
  console.log("Leader login: leader01 / Passw0rd!");
  console.log("Leader login: leader02 / Passw0rd!");
  console.log("Leader login: leader03 / Passw0rd!");
  console.log("Member login: member01 / Passw0rd!");
  console.log("Member login: member02 / Passw0rd!");
  console.log("Member login: member03 / Passw0rd!");
  console.log("Member login: member04 / Passw0rd!");
  console.log("Member login: member05 / Passw0rd!");
  console.log("Member login: member06 / Passw0rd!");
  console.log("Invite code: RECYCLE-2026");
  console.log("Invite code: PULSE-2026");
  console.log("Invite code: NIGHTBITE-2026");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
