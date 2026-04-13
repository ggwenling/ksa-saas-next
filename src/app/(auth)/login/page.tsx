import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute left-[-8%] top-[-8%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(146,219,230,0.42),transparent_68%)] opacity-90" />
      <div className="pointer-events-none absolute bottom-[6%] right-[-6%] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(201,232,241,0.5),transparent_66%)] opacity-90" />
      <LoginForm />
    </main>
  );
}
