import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute right-[-4%] top-[-10%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(185,223,239,0.42),transparent_68%)] opacity-90" />
      <div className="pointer-events-none absolute bottom-[8%] left-[-4%] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(206,238,229,0.52),transparent_66%)] opacity-90" />
      <RegisterForm />
    </main>
  );
}
