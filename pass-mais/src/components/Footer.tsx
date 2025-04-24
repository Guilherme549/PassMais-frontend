export default function Footer() {
    const anoAtual = new Date().getFullYear();
    return (
        <footer className="items-center text-center">
            <span className=" font-normal text-xs text-[#666666]">© Pass+ {anoAtual}</span>
        </footer>
    )
}