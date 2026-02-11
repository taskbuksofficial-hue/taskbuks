import { FastifyReply, FastifyRequest } from 'fastify';

// Mock Data (Simulating DB)
const MOCK_PROFILE = {
    name: "Sumit Kumar",
    phone: "+91 89500 13181",
    email: "sumitkumards07@gmail.com",
    referralCode: "BUKS8829",
    isEmailVerified: false,
    gender: "Male"
};

const MOCK_OFFERS = [
    { id: 1, title: "Fotos AI", subtitle: "Get your insurance photos and took...", reward: 5, icon: "https://lh3.googleusercontent.com/aida-public/AB6AXuDDq5TlMA6symkk6XKAes7jsOVejrkeb3XmL62FpmIAWMVrjVaKWXfcQW8KdNVbdN1cIHhBqAZs3e6HUyfs9uLTgmyDoFputwvjkdJleHY_6JzcXC3ikTilVh2pVRIFHS8LamVQKVq2iVmNuQ_ZHm4879z-aUTlAw8mqdxCPngSvUvHM9fTOUmKezNlilqBagT01n-OmJet7Vq-JHuw7qAlMyV2ZoEKv3-zRRbXRRwUug-WaIyNMADFrb5W9cK8T-jvPZzTFEzbIuw", bgColor: "bg-indigo-500", category: "App" },
    { id: 2, title: "Bajaj Markets", subtitle: "Get your markets for Bajaj station...", reward: 150, textIcon: "M", bgColor: "bg-cyan-500", category: "Finance" },
    { id: 3, title: "Foundit", subtitle: "Earn life more material task...", reward: 10, materialIcon: "psychology", bgColor: "bg-purple-600", category: "Jobs" },
    { id: 4, title: "Dream11", subtitle: "Play fantasy cricket and win big...", reward: 50, materialIcon: "sports_cricket", bgColor: "bg-red-600", category: "Games" },
    { id: 5, title: "Unacademy", subtitle: "Crack your goals with India's platform...", reward: 20, materialIcon: "school", bgColor: "bg-blue-600", category: "Education" }
];

export const getProfile = async (req: FastifyRequest, reply: FastifyReply) => {
    // In real app: Fetch from DB using req.user.id
    return reply.send(MOCK_PROFILE);
};

export const getOffers = async (req: FastifyRequest, reply: FastifyReply) => {
    return reply.send(MOCK_OFFERS);
};

export const getStreak = async (req: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
        streak: Math.floor(Math.random() * 5),
        claimedToday: false
    });
};

export const startTask = async (req: FastifyRequest, reply: FastifyReply) => {
    // Simulate logic
    return reply.send({ success: true, status: 'started' });
};

export const claimBonus = async (req: FastifyRequest, reply: FastifyReply) => {
    // Simulate logic
    return reply.send({ success: true, newBalance: 105 });
};
