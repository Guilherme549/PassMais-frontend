"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud } from "lucide-react";

type FormDataState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cpf: string;
  day: string;
  month: string;
  year: string;
  crm: string;
  about: string;
  password: string;
  confirmPassword: string;
  photo: File | null;
  acceptTerms: boolean;
};

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<FormDataState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cpf: "",
    day: "",
    month: "",
    year: "",
    crm: "",
    about: "",
    password: "",
    confirmPassword: "",
    photo: null,
    acceptTerms: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const name = (target as any).name as keyof FormDataState;
    const isCheckbox =
      (target as any).type && (target as any).type === "checkbox";
    const value = isCheckbox
      ? (target as HTMLInputElement).checked
      : target.value;
    setFormData((prev) => ({ ...prev, [name]: value } as FormDataState));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, photo: file }));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] || null;
    setFormData((prev) => ({ ...prev, photo: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (!formData.acceptTerms) {
      setError("Você deve aceitar os termos e condições");
      return;
    }

    const payload = {
      ...formData,
      fullName: `${formData.firstName} ${formData.lastName}`.trim(),
      photoName: formData.photo?.name || null,
    };

    console.log("Form submitted:", payload);
    // Adicione aqui a chamada de API para enviar os dados
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F6FA]">
      <div className="flex-1 py-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-2xl font-semibold">Cadastre seu perfil profissional como médico(a) no Pass+</h2>
            </div>

            {error && (
              <div className="px-6 pt-4">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-8">
              {/* Nome completo em duas colunas */}
              <div className="space-y-2">
                <Label className="text-sm">Nome</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Nome"
                    className="h-11"
                    required
                  />
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Sobrenome"
                    className="h-11"
                    required
                  />
                </div>
              </div>

              {/* E-mail */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">
                  E-mail
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="ex: meuemail@exemplo.com"
                  className="h-11"
                  required
                />
                <p className="text-[12px] text-gray-500">exemplo@exemplo.com</p>
              </div>

              {/* Upload da foto com área de drop */}
              <div className="space-y-2">
                <Label className="text-sm">Foto do profissional</Label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full h-36 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 text-center cursor-pointer hover:bg-gray-100 transition"
                >
                  <UploadCloud className="text-gray-400" size={28} />
                  <p className="mt-2 text-sm font-medium text-gray-600">
                    Envie um arquivo
                  </p>
                  <p className="text-xs text-gray-500">
                    Arraste e solte a foto aqui
                  </p>
                  {formData.photo && (
                    <p className="mt-2 text-xs text-gray-700">Selecionado: {formData.photo.name}</p>
                  )}
                  <input
                    ref={fileInputRef}
                    id="picture"
                    name="picture"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <p className="text-[12px] text-gray-500">Escolha uma foto clara e convidativa para convencer seus pacientes.</p>
              </div>

              {/* Contato e documentos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="text"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(11) 91234-5678"
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-sm">
                    CPF
                  </Label>
                  <Input
                    id="cpf"
                    name="cpf"
                    type="text"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    placeholder="123.456.789-00"
                    className="h-11"
                    required
                  />
                </div>
              </div>

              {/* Data de nascimento */}
              <div className="space-y-2">
                <Label className="text-sm">Data de nascimento</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    id="day"
                    name="day"
                    type="number"
                    value={formData.day}
                    onChange={handleInputChange}
                    placeholder="Dia"
                    className="h-11"
                    required
                  />
                  <Input
                    id="month"
                    name="month"
                    type="number"
                    value={formData.month}
                    onChange={handleInputChange}
                    placeholder="Mês"
                    className="h-11"
                    required
                  />
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    value={formData.year}
                    onChange={handleInputChange}
                    placeholder="Ano"
                    className="h-11"
                    required
                  />
                </div>
              </div>

              {/* CRM */}
              <div className="space-y-2">
                <Label htmlFor="crm" className="text-sm">
                  CRM
                </Label>
                <Input
                  id="crm"
                  name="crm"
                  type="text"
                  value={formData.crm}
                  onChange={handleInputChange}
                  placeholder="CRM/SP 123456"
                  className="h-11"
                  required
                />
              </div>

              {/* Sobre (Comentários) */}
              <div className="space-y-2">
                <Label htmlFor="about" className="text-sm">
                  Sobre
                </Label>
                <textarea
                  id="about"
                  name="about"
                  value={formData.about}
                  onChange={handleInputChange}
                  placeholder="Diga um pouco sobre você, sua formação e experiência."
                  className="w-full min-h-[120px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#5179EF] focus:ring-opacity-20"
                />
              </div>

              {/* Senhas lado a lado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Crie sua senha"
                      className="h-11 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <IoMdEye size={20} /> : <IoMdEyeOff size={20} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm">
                    Confirmar senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirme sua senha"
                      className="h-11 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? (
                        <IoMdEye size={20} />
                      ) : (
                        <IoMdEyeOff size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="pt-2 space-y-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    name="acceptTerms"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-500">
                    Li e concordo com os
                    {" "}
                    <Link href="/termos" className="text-blue-600 hover:text-blue-800">
                      Termos e condições
                    </Link>
                    {" "}e {" "}
                    <Link href="/privacidade" className="text-blue-600 hover:text-blue-800">
                      política de privacidade
                    </Link>
                  </label>
                </div>
                <button
                  type="submit"
                  className="bg-[#5179EF] text-white w-full h-[40px] rounded-[6px] cursor-pointer transition transform active:scale-95 duration-100"
                >
                  Enviar cadastro
                </button>
              </div>

              <div className="pt-2">
                <div className="h-px bg-gray-200 w-full" />
                <span className="flex justify-center text-sm text-gray-500 mt-2">
                  ou
                </span>
                <div className="text-center">
                  <Link href="/medicos/login-medico">
                    <span className="text-[#5179EF] hover:text-blue-800 text-sm mt-2 inline-block">
                      Já tem uma conta? Acesse
                    </span>
                  </Link>
                  <br />
                  <Link href="/register">
                    <span className="text-[#5179EF] hover:text-blue-800 text-sm mt-2 inline-block">
                      É um paciente? Faça seu cadastro aqui
                    </span>
                  </Link>
                </div>
              </div>
            </form>
          </div>

          
        </div>
      </div>
    </div>
  );
}
