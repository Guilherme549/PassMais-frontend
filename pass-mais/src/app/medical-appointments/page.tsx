import NavBar from "@/components/NavBar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SearchBar from "./components/SearchBar";

export default async function MedicalAppointments() {
    const session = await getServerSession();

    if (!session) {
        redirect("/");
    }

    return (
        <div>
            <NavBar />
            <div className="flex justify-center items-center w-full">
                <div className="w-[76rem]">
                    <h2 className="text-[32px] text-black font-semibold mt-[41px] mb-[45px]  px-1">Encontre seu médico</h2>
                    <SearchBar />
                </div>
            </div>
        </div>
    );
}
