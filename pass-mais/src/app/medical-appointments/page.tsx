import NavBar from "@/components/NavBar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import DoctorCard from "./components/DoctorCard";
import SearchBar from "./components/SearchBar";

export default async function MedicalAppointments() {
    const session = await getServerSession();

    if (!session) {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />
            <div className="flex justify-center items-center w-full px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-5xl">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-[100px] mb-10 px-2 
                        tracking-tight">
                        Encontre seu médico
                    </h2>
                    <div className="space-y-8">
                        <SearchBar />
                        <DoctorCard />
                        <DoctorCard />
                        <DoctorCard />
                    </div>
                </div>
            </div>
        </div>
    );
}