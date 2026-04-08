import { signOut } from "@/auth";

export default function SignOutForm() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        style={{
          width: "100%", textAlign: "left",
          fontSize: 13, color: "rgba(255,255,255,0.35)",
          background: "none", border: "none", cursor: "pointer",
          padding: "8px 12px", borderRadius: 8,
        }}
      >
        Abmelden
      </button>
    </form>
  );
}
