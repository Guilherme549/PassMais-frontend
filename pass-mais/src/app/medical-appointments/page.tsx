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
                <div className="w-[71.25rem]">
                    <SearchBar />
                </div>
            </div>
        </div>
    );
}
