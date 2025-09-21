"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud } from "lucide-react";

const SPECIALTIES = [
  "Clínica Geral",
  "Cardiologia",
  "Pediatria",
  "Dermatologia",
  "Ginecologia",
  "Obstetrícia",
  "Ortopedia",
  "Neurologia",
  "Psiquiatria",
  "Endocrinologia",
  "Gastroenterologia",
  "Nefrologia",
  "Pneumologia",
  "Oncologia",
  "Reumatologia",
  "Oftalmologia",
  "Otorrinolaringologia",
  "Urologia",
  "Anestesiologia",
  "Hematologia",
  "Infectologia",
  "Nutrologia",
  "Medicina de Família e Comunidade",
];

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
  specialty: string;
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
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const router = useRouter();

  const revokePreview = (url: string | null) => {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    return () => {
      revokePreview(photoPreview);
    };
  }, [photoPreview]);

  const updatePhotoFile = (file: File | null) => {
    revokePreview(photoPreview);
    if (!file) {
      setPhotoPreview(null);
      setFormData((prev) => ({ ...prev, photo: null }));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    setFormData((prev) => ({ ...prev, photo: file }));
    setPhotoError(null);
  };

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
    specialty: "",
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
    updatePhotoFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] || null;
    updatePhotoFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccess("");
    setPhotoError(null);

    const clientErrors: string[] = [];
    // Basic client-side validations to avoid backend 400
    const sanitizeDigits = (v: string) => v.replace(/\D+/g, "");
    const emailOk = /.+@.+\..+/.test(formData.email);
    if (!emailOk) clientErrors.push("Informe um e-mail válido");
    const phoneDigits = sanitizeDigits(formData.phone);
    if (phoneDigits.length < 10 || phoneDigits.length > 11) clientErrors.push("Telefone inválido");
    const cpfDigits = sanitizeDigits(formData.cpf);
    if (cpfDigits.length !== 11) clientErrors.push("CPF inválido");
    const dayNum = Number(formData.day);
    const monthNum = Number(formData.month);
    const yearNum = Number(formData.year);
    const now = new Date();
    const minYear = 1900;
    const maxYear = now.getFullYear();
    let birthDateValid = true;
    if (
      !Number.isFinite(dayNum) ||
      !Number.isFinite(monthNum) ||
      !Number.isFinite(yearNum) ||
      dayNum < 1 || dayNum > 31 ||
      monthNum < 1 || monthNum > 12 ||
      yearNum < minYear || yearNum > maxYear
    ) {
      birthDateValid = false;
    } else {
      const testDate = new Date(yearNum, monthNum - 1, dayNum);
      if (
        testDate.getFullYear() !== yearNum ||
        testDate.getMonth() !== monthNum - 1 ||
        testDate.getDate() !== dayNum
      ) {
        birthDateValid = false;
      }
    }
    if (!birthDateValid) clientErrors.push("Data de nascimento inválida");
    if (formData.password !== formData.confirmPassword) {
      clientErrors.push("As senhas não coincidem");
    }
    if (!formData.acceptTerms) {
      clientErrors.push("Você deve aceitar os termos e condições");
    }
    if (!formData.photo) {
      const message = "Envie a foto do profissional antes de finalizar o cadastro.";
      clientErrors.push(message);
      setPhotoError(message);
    }
    if (clientErrors.length) {
      setErrors(clientErrors);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    const birthDate = `${String(formData.year).padStart(4, "0")}-${String(
      formData.month
    ).padStart(2, "0")}-${String(formData.day).padStart(2, "0")}`;
    const phone = phoneDigits;
    const cpf = cpfDigits;

    const doctorData = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      lgpdAccepted: formData.acceptTerms === true,
      crm: formData.crm,
      phone,
      cpf,
      birthDate,
      bio: formData.about,
      specialty: formData.specialty,
      consultationPrice: 1,
    };

    const payload = new FormData();
    payload.append("photoUrl", formData.photo);
    payload.append(
      "doctor",
      new Blob([JSON.stringify(doctorData)], { type: "application/json" })
    );

    try {
      // Usa o proxy do Next.js para evitar CORS e centralizar o uso de NEXT_PUBLIC_API_BASE_URL no servidor
      const response = await fetch(`/api/registration/doctor`, {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        const collected: string[] = [`Erro ao enviar cadastro (HTTP ${response.status})`];
        if (contentType.includes("application/json")) {
          try {
            const data = await response.json();
            if (data?.message) collected.push(String(data.message));
            if (data?.error) collected.push(String(data.error));
            if (Array.isArray(data?.errors)) {
              for (const e of data.errors) {
                if (!e) continue;
                const item = e.message || e.field || JSON.stringify(e);
                if (item) collected.push(String(item));
              }
            }
            if (Array.isArray(data?.violations)) {
              for (const v of data.violations) {
                const item = [v?.field, v?.message].filter(Boolean).join(": ");
                if (item) collected.push(item);
              }
            }
            if (data?.details) collected.push(String(data.details));
          } catch {
            // ignore JSON parse errors
          }
        } else {
          const text = await response.text();
          if (text) collected.push(text);
        }
        setErrors(collected);
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }

      console.log("Cadastro de médico enviado com sucesso");
      // Mostra mensagem de sucesso e rola para o topo
      setSuccess("Cadastro realizado com sucesso! Você será redirecionado.");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      updatePhotoFile(null);
      // Redireciona para login do médico após breve pausa
      setTimeout(() => router.push("/medicos/login-medico"), 1000);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao enviar o cadastro.";
      setErrors([message]);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      console.error("Falha ao enviar cadastro de médico:", err);
    }
  };

  const previewImage = photoPreview;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F6FA]">
      <div className="flex-1 py-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-2xl font-semibold">Cadastre seu perfil profissional como médico(a) no Pass+</h2>
            </div>

            {errors.length > 0 && (
              <div className="px-6 pt-4">
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
                  <p className="font-medium mb-1 text-center">Corrija os seguintes pontos:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {success && (
              <div className="px-6 pt-4">
                <p className="text-green-600 text-sm text-center font-medium">{success}</p>
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
                    autoComplete="given-name"
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
                    autoComplete="family-name"
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
                  autoComplete="email"
                  required
                />
                <p className="text-[12px] text-gray-500">exemplo@exemplo.com</p>
              </div>

              {/* Upload da foto com área de drop */}
              <div className="space-y-2">
                <Label className="text-sm">
                  Foto do profissional <span className="text-red-600">*</span>
                </Label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center w-full h-36 rounded-md border-2 border-dashed text-center cursor-pointer transition ${
                    photoError
                      ? "border-red-400 bg-red-50 hover:bg-red-100"
                      : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                  }`}
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
                  {previewImage && (
                    <div className="mt-3">
                      <img
                        src={previewImage}
                        alt="Pré-visualização da foto do profissional"
                        className="h-16 w-16 rounded-full object-cover mx-auto border border-gray-200"
                      />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    id="picture"
                    name="picture"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                </div>
                {photoError && (
                  <p className="text-xs text-red-600">{photoError}</p>
                )}
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
                    autoComplete="tel"
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
                    autoComplete="off"
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
                    autoComplete="bday-day"
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
                    autoComplete="bday-month"
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
                    autoComplete="bday-year"
                    required
                  />
                </div>
              </div>

              {/* CRM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    autoComplete="off"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty" className="text-sm">
                    Especialidade
                  </Label>
                  <div>
                    <Input
                      id="specialty"
                      name="specialty"
                      type="text"
                      value={formData.specialty}
                      onChange={handleInputChange}
                      placeholder="Ex: Cardiologia, Pediatria, Dermatologia..."
                      className="h-11"
                      list="specialties"
                      autoComplete="off"
                      required
                    />
                    <datalist id="specialties">
                      {SPECIALTIES.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </div>
                </div>
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
                      autoComplete="new-password"
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
                      autoComplete="new-password"
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
