import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
});

async function upsertUser(username, displayName, role) {
  const passwordHash = await hash("Passw0rd!", 10);
  return prisma.user.upsert({
    where: { username },
    update: { displayName, role, passwordHash, isActive: true },
    create: { username, displayName, role, passwordHash },
  });
}

async function main() {
  const teacher = await upsertUser("teacher01", "Teacher One", "TEACHER");
  const leader = await upsertUser("leader01", "Leader One", "LEADER");
  const member = await upsertUser("member01", "Member One", "MEMBER");

  const team = await prisma.team.upsert({
    where: { id: "seed-team-001" },
    update: { name: "Seed Demo Team", description: "Seeded team for local demo", leaderId: leader.id },
    create: {
      id: "seed-team-001",
      name: "Seed Demo Team",
      description: "Seeded team for local demo",
      leaderId: leader.id,
    },
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: leader.id } },
    update: {},
    create: { teamId: team.id, userId: leader.id },
  });
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: member.id } },
    update: {},
    create: { teamId: team.id, userId: member.id },
  });

  await prisma.inviteCode.upsert({
    where: { code: "TEAM-DEMO001" },
    update: { teamId: team.id, createdById: leader.id, isActive: true },
    create: {
      code: "TEAM-DEMO001",
      teamId: team.id,
      createdById: leader.id,
      isActive: true,
      maxUses: 999,
    },
  });

  const existingTaskCount = await prisma.task.count({ where: { teamId: team.id } });
  if (existingTaskCount === 0) {
    await prisma.task.createMany({
      data: [
        {
          teamId: team.id,
          title: "Finalize market analysis",
          description: "Collect 3 competitor cases",
          objective: "Output a market analysis section that can be inserted into the business plan.",
          acceptanceCriteria:
            "Collect at least 3 competitor cases\nCreate a comparison table\nWrite a summary conclusion",
          nextActions:
            "Complete competitor screenshots\nSummarize target users\nSync findings with the presentation owner",
          risks: "Too few cases may weaken the conclusion\nOld data may affect credibility",
          deliverables: "Competitor analysis sheet\nMarket insight summary",
          collaborationNote: "Share the result with the pitch team after drafting the summary.",
          priority: "高",
          status: "TODO",
          creatorId: leader.id,
          assigneeId: member.id,
        },
        {
          teamId: team.id,
          title: "Prepare pitch storyline",
          description: "Draft 10-slide structure",
          objective: "Finish a complete pitch flow for the classroom defense.",
          acceptanceCriteria:
            "Slides cover problem, solution, market, team and finance\nSpeaking order is clear",
          nextActions: "Draft the speaking outline\nCollect data support\nRun one rehearsal",
          risks: "Too much content may cause overtime",
          deliverables: "Pitch outline\nSpeaking notes",
          collaborationNote: "Creator should align the storytelling order with each presenter.",
          priority: "高",
          status: "IN_PROGRESS",
          creatorId: leader.id,
          assigneeId: leader.id,
        },
        {
          teamId: team.id,
          title: "Assign team roles",
          description: "Complete role matrix",
          objective: "Make team responsibilities clear and executable.",
          acceptanceCriteria:
            "Every member has an explicit role\nRoles map to tasks in the board",
          nextActions: "Review role balance\nSync with the whole team",
          risks: "Role overlap may increase communication cost",
          deliverables: "Role matrix\nResponsibility notes",
          collaborationNote: "The creator should confirm final ownership before team sync.",
          priority: "中",
          status: "DONE",
          creatorId: leader.id,
          assigneeId: leader.id,
        },
      ],
    });
  }

  const existingAnnouncementCount = await prisma.announcement.count();
  if (existingAnnouncementCount === 0) {
    await prisma.announcement.createMany({
      data: [
        {
          title: "课程进度公告",
          content: "本周请各组完成任务拆解并同步到看板，周日20:00前截止。",
          authorId: teacher.id,
        },
        {
          title: "小组协作提醒",
          content: "请每位成员及时更新任务状态，避免截止前集中提交。",
          authorId: leader.id,
        },
      ],
    });
  }

  console.log("Seed completed");
  console.log("Teacher login: teacher01 / Passw0rd!");
  console.log("Leader login: leader01 / Passw0rd!");
  console.log("Member login: member01 / Passw0rd!");
  console.log("Invite code: TEAM-DEMO001");
  console.log("Teacher id:", teacher.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
