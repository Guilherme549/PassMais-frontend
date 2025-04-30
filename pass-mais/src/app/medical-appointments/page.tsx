import NavBar from "@/components/NavBar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SearchBar from "./components/SearchBar";


export default async function MedicalAppointments() {
    const session = await getServerSession();

    if (!session) {
        redirect("/");
    }

    // Doctor fictício


    return (
        <div>
            <NavBar />
            <div className="flex justify-center items-center w-full">
                <div className="w-full max-w-[76rem] px-4">
                    <h2 className="text-2xl sm:text-3xl text-black font-semibold mt-10 mb-12 px-1">
                        Encontre seu médico
                    </h2>
                    <SearchBar />


                </div>
            </div>
        </div>
    );
}