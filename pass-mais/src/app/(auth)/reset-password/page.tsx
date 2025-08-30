import Link from "next/link";
import LoginImage from "../components/LoginImage";

export default function resetPassword() {
    return (
        <div className="flex h-[100vh] w-[100vw]">
            <LoginImage />

            <div className="w-[22.5rem] mx-auto m-[100px] mb-[0px]">
                <div >
                    <form>
                        <h2 className="text-2xl font-semibold mb-[4px] text-[#1A1A1A]">Redefina sua senha Agora</h2>
                        <p className="w-ful text-[#1B2734] mb-[22px]">Você receberá uma mensagem com o link para criar sua nova senha</p>

                        <div className="w-full flex flex-col mb-[36px]">
                            <label htmlFor="email" className="flex flex-col text-sm pl-[16px] pb-[8px]">Email</label>
                            <input id="email" type="email" name='email' placeholder="Insira o seu email" className="outline-none  w-full h-[48px] bg-[#E5E5E5] mb-[16px] rounded-[6px] pl-[16px] focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20" />
                        </div>

                        <button className="bg-[#007AFF] text-white w-full h-[40px] rounded-[6px] cursor-pointer transition transform active:scale-95 duration-100 mb-[17px]">Enviar link de recuperação</button>

                        <div className="flex items-center justify-center w-full mb-[21px]">
                            <Link href="/" className="text-[#007AFF]">Cancelar</Link>
                        </div>

                        <hr className="h-[1px] mb-[21px] text-[#E5E5E5] w-full" />

                        <div className="size-12 font-regular text-center w-full line-we">
                            <span>Ainda não tem conta?</span>
                            <Link href="/register">
                                <span className="text-[#007AFF]"> Crie uma conta aqui</span>
                            </Link>
                        </div>
                    </form>
                </div>
                
            </div>
        </div>
    )
}
