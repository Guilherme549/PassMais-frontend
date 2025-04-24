import { ChevronDown } from "lucide-react";
import Link from 'next/link';
export default function NavBar() {
    return (
        <nav className="h-[3.56rem] w-full bg-white shadow-sm">
            <div className="flex justify-between items-center text-center px-[319px] h-full">
                <div>
                    <Link href="/">
                        <span className="text-[#2563EB] font-bold text-2xl">Pass+</span>
                    </Link>
                </div>
                <div className="flex gap-12">
                    <Link href="#">
                        <span className="text-[#4B5563] text-xl hover:text-[#1078B0]">Minhas consultas</span>
                    </Link>
                    <button className="flex gap-1 text-[#4B5563] text-xl  hover:text-[#1078B0] cursor-pointer">Minha conta<ChevronDown /></button>
                </div>
            </div>
        </nav>
    )
}