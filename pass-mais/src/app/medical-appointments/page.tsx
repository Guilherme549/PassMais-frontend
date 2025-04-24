import NavBar from "@/components/NavBar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function MedicalAppointments() {
    const session = await getServerSession();

    if (!session) {
        redirect("/");
    }

    return (
        <div className="bg-[#D9D9D9]">
            <NavBar />
        </div>
    );
}
