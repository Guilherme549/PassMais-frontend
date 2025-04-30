import NavBar from "@/components/NavBar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SearchBar from "./components/SearchBar";
import DoctorCard from "./components/DoctorCard";

export default async function MedicalAppointments() {
    const session = await getServerSession();

    if (!session) {
        redirect("/");
    }

    // Doctor fictício
    const doctor = {
        name: "Dr. Mariana Oliveira Costa",
        specialty: "Cardiologista",
        crm: "12.3456",
        rating: 4.8,
        reviews: 92,
        price: 300.00,
        address: "Av. das Palmeiras, 123 - Centro, São Paulo - SP, 01001-000",
        about: "Sou uma cardiologista apaixonada por ajudar meus pacientes a terem uma vida mais saudável. Com mais de 10 anos de experiência, meu foco é na prevenção e no tratamento de doenças cardíacas, sempre com empatia e cuidado personalizado.",
        image: "/images/doctors/mariana-costa.jpg"
    };

    return (
        <div>
            <NavBar />
            <div className="flex justify-center items-center w-full">
                <div className="w-full max-w-[76rem] px-4">
                    <h2 className="text-2xl sm:text-3xl text-black font-semibold mt-10 mb-12 px-1">
                        Encontre seu médico
                    </h2>
                    <SearchBar/>
                    <DoctorCard doctor={doctor} />
                    
                </div>
            </div>
        </div>
    );
}