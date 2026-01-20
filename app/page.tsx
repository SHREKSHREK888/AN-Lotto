import { redirect } from "next/navigation";

export default function Home() {
  // Check if authenticated, redirect accordingly
  redirect("/login");
}
