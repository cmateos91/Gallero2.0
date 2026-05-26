import type { PrismaClient } from "@prisma/client";

export async function getFriends(prisma: PrismaClient, userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: { userId },
    include: { friend: { select: { id: true, username: true, mmr: true } } },
  });
  return friendships.map((f) => f.friend);
}

export async function searchPlayers(prisma: PrismaClient, q: string, userId: string) {
  return prisma.user.findMany({
    where: {
      username: { contains: q, mode: "insensitive" },
      id: { not: userId },
    },
    take: 10,
    select: { id: true, username: true, mmr: true },
  });
}

export async function getPendingRequests(prisma: PrismaClient, userId: string) {
  return prisma.friendRequest.findMany({
    where: { receiverId: userId, status: "PENDING" },
    include: { sender: { select: { id: true, username: true } } },
  });
}

export async function sendFriendRequest(
  prisma: PrismaClient,
  senderId: string,
  receiverId: string,
): Promise<void> {
  if (senderId === receiverId) throw Object.assign(new Error("No puedes enviarte una solicitud"), { status: 400 });

  const existing = await prisma.friendRequest.findUnique({
    where: { senderId_receiverId: { senderId, receiverId } },
  });
  if (existing) throw Object.assign(new Error("Solicitud ya enviada"), { status: 409 });

  const alreadyFriends = await prisma.friendship.findUnique({
    where: { userId_friendId: { userId: senderId, friendId: receiverId } },
  });
  if (alreadyFriends) throw Object.assign(new Error("Ya son amigos"), { status: 409 });

  await prisma.friendRequest.create({ data: { senderId, receiverId, status: "PENDING" } });
}

export async function respondFriendRequest(
  prisma: PrismaClient,
  userId: string,
  requestId: string,
  accept: boolean,
): Promise<void> {
  const req = await prisma.friendRequest.findFirst({
    where: { id: requestId, receiverId: userId, status: "PENDING" },
  });
  if (!req) throw Object.assign(new Error("Solicitud no encontrada"), { status: 404 });

  if (accept) {
    await prisma.$transaction([
      prisma.friendRequest.update({ where: { id: requestId }, data: { status: "ACCEPTED" } }),
      prisma.friendship.createMany({
        data: [
          { userId: req.senderId, friendId: req.receiverId },
          { userId: req.receiverId, friendId: req.senderId },
        ],
        skipDuplicates: true,
      }),
    ]);
  } else {
    await prisma.friendRequest.update({ where: { id: requestId }, data: { status: "REJECTED" } });
  }
}

export async function removeFriend(
  prisma: PrismaClient,
  userId: string,
  friendId: string,
): Promise<void> {
  await prisma.friendship.deleteMany({
    where: { OR: [
      { userId, friendId },
      { userId: friendId, friendId: userId },
    ]},
  });
}
