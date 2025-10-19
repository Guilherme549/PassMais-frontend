"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { BriefcaseMedical, ChevronDown, MapPin, Search, ShieldCheck } from "lucide-react";

interface SearchBarProps {
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    insuranceOptions?: string[];
}

type CityOption = {
    city: string;
    state: string;
};

const DEFAULT_CITY_VISIBLE = 5;
const CITY_INCREMENT = 10;

const DIACRITICS_REGEX = /[\u0300-\u036f]/g;

const MAX_FILTERED_CITY_RESULTS = 60;

type SearchableCity = CityOption & {
    normalized: string;
};

function normalizeForSearchValue(value: string | null | undefined) {
    if (!value) return "";
    return value
        .normalize("NFD")
        .replace(DIACRITICS_REGEX, "")
        .toLowerCase()
        .trim();
}

function toSearchableCity(value: CityOption): SearchableCity {
    return {
        ...value,
        normalized: normalizeForSearchValue(`${value.city} ${value.state}`),
    };
}

const TOP_SPECIALTIES = [
    "Clínico Geral",
    "Ginecologista",
    "Psiquiatra",
    "Psicólogo",
    "Ortopedista",
    "Dermatologista",
    "Pediatra",
    "Endocrinologista",
];

const ADDITIONAL_SPECIALTIES = [
    "Cardiologista",
    "Neurologista",
    "Oftalmologista",
    "Nutricionista",
    "Fisioterapeuta",
    "Reumatologista",
    "Oncologista",
    "Gastroenterologista",
    "Nefrologista",
    "Hematologista",
    "Otorrinolaringologista",
    "Urologista",
    "Infectologista",
    "Angiologista",
    "Anestesiologista",
    "Endoscopista",
    "Hepatologista",
    "Mastologista",
    "Pneumologista",
    "Radiologista",
    "Reumatologista Pediátrico",
    "Neuropediatra",
    "Geriatra",
    "Imunologista",
    "Nutrólogo",
    "Dermatologista Pediátrico",
    "Cardiologista Pediátrico",
    "Oftalmologista Pediátrico",
    "Cirurgião Geral",
    "Cirurgião Plástico",
    "Endocrinologista Pediátrico",
];

const ALL_SPECIALTIES = Array.from(new Set([...TOP_SPECIALTIES, ...ADDITIONAL_SPECIALTIES])).sort();

const TOP_INSURANCES = [
    "Unimed",
    "Amil",
    "Bradesco Saúde",
    "SulAmérica Saúde",
    "Hapvida",
    "NotreDame Intermédica",
    "Porto Saúde",
    "Caixa Saúde",
    "São Francisco Saúde",
    "Prevent Senior",
    "Ipasgo",
];

const ADDITIONAL_INSURANCES = [
    "Allianz Saúde",
    "Golden Cross",
    "Omint Saúde",
    "Notredame Easy",
    "Santa Helena Saúde",
    "Mediservice",
    "Greenline Saúde",
    "Cabesp",
    "Aliança Saúde",
    "BioVida Saúde",
    "Sobam",
    "Plena Saúde",
    "Smile Saúde",
    "Pame",
    "Postal Saúde",
];

const DEFAULT_INSURANCES = Array.from(
    new Set([...TOP_INSURANCES, ...ADDITIONAL_INSURANCES].map((item) => item.trim()).filter((item) => item.length > 0))
).sort((a, b) => a.localeCompare(b, "pt-BR"));

export default function SearchBar({ onSubmit, insuranceOptions }: SearchBarProps) {
    const containerRef = useRef<HTMLFormElement | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [specialtyQuery, setSpecialtyQuery] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
    const [showAllSpecialties, setShowAllSpecialties] = useState(false);
    const [cityOpen, setCityOpen] = useState(false);
    const [cityQuery, setCityQuery] = useState("");
    const [cityHighlightedIndex, setCityHighlightedIndex] = useState<number | null>(null);
    const [cityVisibleCount, setCityVisibleCount] = useState(DEFAULT_CITY_VISIBLE);
    const [cities, setCities] = useState<SearchableCity[]>([]);
    const [cityLoading, setCityLoading] = useState(false);
    const [cityError, setCityError] = useState<string | null>(null);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [insuranceQuery, setInsuranceQuery] = useState("");
    const [insuranceOpen, setInsuranceOpen] = useState(false);
    const [insuranceHighlightedIndex, setInsuranceHighlightedIndex] = useState<number | null>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setHighlightedIndex(null);
                setShowAllSpecialties(false);
                setCityOpen(false);
                setCityHighlightedIndex(null);
                setCityVisibleCount(DEFAULT_CITY_VISIBLE);
                setInsuranceOpen(false);
                setInsuranceHighlightedIndex(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredSpecialties = useMemo(() => {
        const normalizedQuery = normalizeForSearchValue(specialtyQuery);
        const baseList =
            showAllSpecialties || normalizedQuery.length > 0 ? ALL_SPECIALTIES : TOP_SPECIALTIES;

        if (!normalizedQuery) {
            return baseList;
        }

        return ALL_SPECIALTIES.filter((item) =>
            normalizeForSearchValue(item).includes(normalizedQuery)
        );
    }, [showAllSpecialties, specialtyQuery]);

    const availableInsurances = useMemo(() => {
        const source =
            insuranceOptions && insuranceOptions.length > 0
                ? insuranceOptions
                : DEFAULT_INSURANCES;

        const normalized = source
            .map((item) => (typeof item === "string" ? item.trim() : ""))
            .filter((item) => item.length > 0);

        return Array.from(new Set(normalized)).sort((a, b) => a.localeCompare(b, "pt-BR"));
    }, [insuranceOptions]);

    const filteredInsuranceOptions = useMemo(() => {
        const query = insuranceQuery.trim().toLowerCase();
        if (query.length === 0) {
            return availableInsurances;
        }
        return availableInsurances.filter((item) => item.toLowerCase().includes(query));
    }, [availableInsurances, insuranceQuery]);

    const handleSpecialtySelect = (value: string) => {
        setSpecialtyQuery(value);
        setIsOpen(false);
        setHighlightedIndex(null);
        setShowAllSpecialties(true);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen && ["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
            setIsOpen(true);
            setCityOpen(false);
            setCityHighlightedIndex(null);
            setInsuranceOpen(false);
            setInsuranceHighlightedIndex(null);
            return;
        }

        if (!isOpen) return;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlightedIndex((prev) => {
                if (prev == null) return 0;
                return prev + 1 >= filteredSpecialties.length ? 0 : prev + 1;
            });
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlightedIndex((prev) => {
                if (prev == null) return filteredSpecialties.length - 1;
                return prev - 1 < 0 ? filteredSpecialties.length - 1 : prev - 1;
            });
        }

        if (event.key === "Enter" && highlightedIndex != null) {
            event.preventDefault();
            handleSpecialtySelect(filteredSpecialties[highlightedIndex]);
        }
    };

    useEffect(() => {
        let cancelled = false;
        async function loadCities() {
            setCityLoading(true);
            setCityError(null);
            try {
                const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios");
                if (!response.ok) {
                    throw new Error(`Falha ao buscar municípios (status ${response.status})`);
                }
                const payload = (await response.json()) as Array<{
                    nome: string;
                    microrregiao?: { mesorregiao?: { UF?: { sigla?: string } } };
                }>;

                if (cancelled) return;

                const parsed = payload
                    .map((item) => {
                        const city = item?.nome?.trim();
                        const state = item?.microrregiao?.mesorregiao?.UF?.sigla?.trim();
                        if (!city || !state) return null;
                        return { city, state } satisfies CityOption;
                    })
                    .filter((entry): entry is CityOption => entry !== null);

                const unique = Array.from(
                    new Map(parsed.map((entry) => [`${entry.city}-${entry.state}`, entry])).values()
                ).sort((a, b) => {
                    if (a.state === b.state) return a.city.localeCompare(b.city, "pt-BR");
                    return a.state.localeCompare(b.state, "pt-BR");
                });

                setCities(unique.map(toSearchableCity));
            } catch (error) {
                console.error("Erro ao carregar municípios do IBGE", error);
                if (!cancelled) {
                    setCityError("Não foi possível carregar todas as cidades. Mostrando opções populares.");
                    setCities(
                        [
                            { city: "São Paulo", state: "SP" },
                            { city: "Rio de Janeiro", state: "RJ" },
                            { city: "Brasília", state: "DF" },
                            { city: "Salvador", state: "BA" },
                            { city: "Fortaleza", state: "CE" },
                            { city: "Belo Horizonte", state: "MG" },
                            { city: "Curitiba", state: "PR" },
                            { city: "Recife", state: "PE" },
                            { city: "Porto Alegre", state: "RS" },
                            { city: "Manaus", state: "AM" },
                        ].map(toSearchableCity)
                    );
                }
            } finally {
                if (!cancelled) setCityLoading(false);
            }
        }

        loadCities();
        return () => {
            cancelled = true;
        };
    }, []);

    const deferredCityQuery = useDeferredValue(cityQuery);

    const filteredCities = useMemo(() => {
        const normalizedQuery = normalizeForSearchValue(deferredCityQuery);
        if (!normalizedQuery) return cities;
        return cities.filter((option) => option.normalized.includes(normalizedQuery));
    }, [cities, deferredCityQuery]);

    const handleCitySelect = (value: SearchableCity) => {
        setCityQuery(`${value.city} - ${value.state}`);
        setCityOpen(false);
        setCityHighlightedIndex(null);
        setCityVisibleCount(DEFAULT_CITY_VISIBLE);
        setSelectedCity(value.city);
        setSelectedState(value.state);
    };

    const hasCityQuery = cityQuery.trim().length > 0;
    const displayCities = hasCityQuery
        ? filteredCities.slice(0, MAX_FILTERED_CITY_RESULTS)
        : filteredCities.slice(0, cityVisibleCount);

    useEffect(() => {
        if (cityHighlightedIndex != null && cityHighlightedIndex >= displayCities.length) {
            setCityHighlightedIndex(displayCities.length > 0 ? displayCities.length - 1 : null);
        }
    }, [displayCities, cityHighlightedIndex]);

    const handleCityKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (!cityOpen && ["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
            setCityOpen(true);
            setIsOpen(false);
            setHighlightedIndex(null);
            setInsuranceOpen(false);
            setInsuranceHighlightedIndex(null);
            return;
        }

        if (!cityOpen) return;

        const currentList = displayCities;
        if (currentList.length === 0) return;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setCityHighlightedIndex((prev) => {
                if (prev == null) return 0;
                return prev + 1 >= currentList.length ? 0 : prev + 1;
            });
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setCityHighlightedIndex((prev) => {
                if (prev == null) return currentList.length - 1;
                return prev - 1 < 0 ? currentList.length - 1 : prev - 1;
            });
        }

        if (event.key === "Enter" && cityHighlightedIndex != null) {
            event.preventDefault();
            const option = currentList[cityHighlightedIndex];
            if (option) handleCitySelect(option);
        }
    };

    const openCityDropdown = () => {
        setCityOpen(true);
        setIsOpen(false);
        setHighlightedIndex(null);
        setInsuranceOpen(false);
        setInsuranceHighlightedIndex(null);
        if (cityQuery.trim().length === 0) {
            setCityVisibleCount(DEFAULT_CITY_VISIBLE);
        }
    };

    useEffect(() => {
        const match = cityQuery.match(/^(.*?)(?:\s*-\s*([A-Za-z]{2}))$/);
        if (!match) {
            if (selectedCity !== null || selectedState !== null) {
                setSelectedCity(null);
                setSelectedState(null);
            }
            return;
        }

        const parsedCity = match[1]?.trim() ?? "";
        const parsedState = match[2]?.trim().toUpperCase() ?? "";

        if (parsedCity.length === 0 || parsedState.length === 0) {
            if (selectedCity !== null || selectedState !== null) {
                setSelectedCity(null);
                setSelectedState(null);
            }
            return;
        }

        if (selectedCity !== parsedCity || selectedState !== parsedState) {
            setSelectedCity(parsedCity);
            setSelectedState(parsedState);
        }
    }, [cityQuery, selectedCity, selectedState]);

    const handleInsuranceSelect = (value: string) => {
        setInsuranceQuery(value);
        setInsuranceOpen(false);
        setInsuranceHighlightedIndex(null);
    };

    return (
        <div className="flex w-full px-1">
            <form
                ref={containerRef}
                className="flex w-full max-w-5xl flex-col gap-4 md:flex-row md:gap-3"
                onSubmit={onSubmit}
            >
                {/* Campo de Especialidade Médica */}
                <div className="flex w-full flex-col">
                    <label htmlFor="medical-specialty" className="mb-2 text-lg text-gray-600 md:text-xl">
                        Especialidade médica:
                    </label>
                    <div className="relative">
                        <input
                            id="medical-specialty"
                            name="medical-specialty"
                            type="text"
                            autoComplete="off"
                            placeholder="especialidade, doença ou nome"
                            value={specialtyQuery}
                            onChange={(event) => {
                                setSpecialtyQuery(event.target.value);
                                setIsOpen(true);
                                setCityOpen(false);
                                setCityHighlightedIndex(null);
                                setInsuranceOpen(false);
                                setInsuranceHighlightedIndex(null);
                            }}
                            onFocus={() => {
                                setIsOpen(true);
                                setCityOpen(false);
                                setCityHighlightedIndex(null);
                                setInsuranceOpen(false);
                                setInsuranceHighlightedIndex(null);
                            }}
                            onKeyDown={handleKeyDown}
                            className="h-12 w-full rounded-lg border border-gray-300 bg-white pl-5 pr-10 text-base text-gray-600 shadow-sm outline-none transition focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 md:text-lg"
                        />
                        <button
                            type="button"
                            onClick={() => setIsOpen((prev) => !prev)}
                            onFocusCapture={() => {
                                setIsOpen(true);
                                setCityOpen(false);
                                setCityHighlightedIndex(null);
                                setInsuranceOpen(false);
                                setInsuranceHighlightedIndex(null);
                            }}
                            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                            aria-label="Abrir lista de especialidades"
                        >
                            <ChevronDown size={18} />
                        </button>

                        {isOpen && (
                            <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                                <ul className="max-h-72 overflow-y-auto py-2 text-sm text-gray-700">
                                    {filteredSpecialties.length === 0 && (
                                        <li className="px-5 py-3 text-gray-400">Nenhuma especialidade encontrada.</li>
                                    )}
                                    {filteredSpecialties.map((item, index) => {
                                        const isHighlighted = index === highlightedIndex;

                                        return (
                                            <li key={item}>
                                                <button
                                                    type="button"
                                                    onMouseEnter={() => setHighlightedIndex(index)}
                                                    onMouseLeave={() => setHighlightedIndex(null)}
                                                    onClick={() => handleSpecialtySelect(item)}
                                                    className={`flex w-full items-center justify-between px-5 py-3 text-left transition ${
                                                        isHighlighted ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-3">
                                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-500">
                                                            <BriefcaseMedical className="h-4 w-4" />
                                                        </span>
                                                        <span className="text-base font-medium">{item}</span>
                                                    </span>
                                                    <span className="text-xs uppercase tracking-wide text-gray-400">
                                                        Especialidade
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                                <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-center text-sm">
                                    <button
                                        type="button"
                                        className="font-medium text-blue-600 hover:text-blue-700"
                                        onClick={() => {
                                            setSpecialtyQuery("");
                                            setHighlightedIndex(null);
                                            setShowAllSpecialties(true);
                                            setIsOpen(true);
                                        }}
                                    >
                                        Todas as especialidades
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Campo de Cidade ou Região */}
                <div className="flex w-full flex-col">
                    <label htmlFor="city-region" className="mb-2 text-lg text-gray-600 md:text-xl">
                        Cidade ou região:
                    </label>
                    <div className="relative">
                        <input
                            id="city-region"
                            name="city-region"
                            type="text"
                            autoComplete="off"
                            placeholder="cidade ou região"
                            value={cityQuery}
                            onChange={(event) => {
                                setCityQuery(event.target.value);
                                openCityDropdown();
                                setSelectedCity(null);
                                setSelectedState(null);
                            }}
                            onFocus={() => {
                                openCityDropdown();
                            }}
                            onKeyDown={handleCityKeyDown}
                            className="h-12 w-full rounded-lg border border-gray-300 bg-white pl-5 pr-10 text-base text-gray-600 shadow-sm outline-none transition focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 md:text-lg"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                if (cityOpen) {
                                    setCityOpen(false);
                                } else {
                                    openCityDropdown();
                                }
                            }}
                            onFocusCapture={() => {
                                if (!cityOpen) {
                                    openCityDropdown();
                                }
                            }}
                            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                            aria-label="Abrir lista de cidades"
                        >
                            <ChevronDown size={18} />
                        </button>

                        {cityOpen && (
                            <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                                <div className="flex items-center justify-between px-5 py-2 text-xs uppercase tracking-wide text-gray-400">
                                    <span>Cidade</span>
                                    <span>Estado</span>
                                </div>
                                <ul className="max-h-72 overflow-y-auto py-2 text-sm text-gray-700">
                                    {cityLoading && (
                                        <li className="px-5 py-3 text-gray-400">Carregando cidades...</li>
                                    )}
                                    {!cityLoading && displayCities.length === 0 && (
                                        <li className="px-5 py-3 text-gray-400">Nenhuma cidade encontrada.</li>
                                    )}
                                    {!cityLoading &&
                                        displayCities.map((option, index) => {
                                            const isHighlighted = index === cityHighlightedIndex;
                                            return (
                                                <li key={`${option.city}-${option.state}`}>
                                                    <button
                                                        type="button"
                                                        onMouseEnter={() => setCityHighlightedIndex(index)}
                                                        onMouseLeave={() => setCityHighlightedIndex(null)}
                                                        onClick={() => handleCitySelect(option)}
                                                        className={`flex w-full items-center justify-between px-5 py-3 text-left transition ${
                                                            isHighlighted ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                                                        }`}
                                                    >
                                                        <span className="flex items-center gap-3">
                                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-500">
                                                                <MapPin className="h-4 w-4" />
                                                            </span>
                                                            <span className="text-base font-medium">{option.city}</span>
                                                        </span>
                                                        <span className="text-xs font-semibold text-gray-400">{option.state}</span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                </ul>
                                <div className="border-t border-gray-100 bg-gray-50 px-5 py-2 text-center">
                                    {!hasCityQuery && !cityLoading && cityVisibleCount < cities.length && (
                                        <button
                                            type="button"
                                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                            onClick={() => {
                                                setCityVisibleCount((prev) =>
                                                    Math.min(prev + CITY_INCREMENT, cities.length)
                                                );
                                                setCityHighlightedIndex(null);
                                            }}
                                        >
                                            Ver todas as cidades
                                        </button>
                                    )}
                                    {cityError && (
                                        <p className="mt-2 text-xs text-amber-600">{cityError}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Campo de Convênio */}
                <div className="flex w-full flex-col">
                    <label htmlFor="health-insurance" className="mb-2 text-lg text-gray-600 md:text-xl">
                        Convênio:
                    </label>
                    <div className="relative">
                        <input
                            id="health-insurance"
                            name="health-insurance"
                            type="text"
                            autoComplete="off"
                            placeholder="nome do convênio"
                            value={insuranceQuery}
                            onChange={(event) => {
                                setInsuranceQuery(event.target.value);
                                setInsuranceOpen(true);
                                setIsOpen(false);
                                setHighlightedIndex(null);
                                setCityOpen(false);
                                setCityHighlightedIndex(null);
                            }}
                            onFocus={() => {
                                setInsuranceOpen(true);
                                setIsOpen(false);
                                setHighlightedIndex(null);
                                setCityOpen(false);
                                setCityHighlightedIndex(null);
                            }}
                            onKeyDown={(event) => {
                                if (!insuranceOpen && ["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
                                    setInsuranceOpen(true);
                                    setIsOpen(false);
                                    setCityOpen(false);
                                    setHighlightedIndex(null);
                                    setCityHighlightedIndex(null);
                                    return;
                                }

                                if (!insuranceOpen) return;

                                if (event.key === "ArrowDown") {
                                    event.preventDefault();
                                    setInsuranceHighlightedIndex((prev) => {
                                        if (prev == null) return 0;
                                        return prev + 1 >= filteredInsuranceOptions.length ? 0 : prev + 1;
                                    });
                                }

                                if (event.key === "ArrowUp") {
                                    event.preventDefault();
                                    setInsuranceHighlightedIndex((prev) => {
                                        if (prev == null) return filteredInsuranceOptions.length - 1;
                                        return prev - 1 < 0 ? filteredInsuranceOptions.length - 1 : prev - 1;
                                    });
                                }

                                if (event.key === "Enter" && insuranceHighlightedIndex != null) {
                                    event.preventDefault();
                                    const option = filteredInsuranceOptions[insuranceHighlightedIndex];
                                    if (option) {
                                        handleInsuranceSelect(option);
                                    }
                                }
                            }}
                            className="h-12 w-full rounded-lg border border-gray-300 bg-white pl-5 pr-10 text-base text-gray-600 shadow-sm outline-none transition focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 md:text-lg"
                        />
                        <button
                            type="button"
                            onClick={() => setInsuranceOpen((prev) => {
                                const next = !prev;
                                if (next) {
                                    setIsOpen(false);
                                    setHighlightedIndex(null);
                                    setCityOpen(false);
                                    setCityHighlightedIndex(null);
                                } else {
                                    setInsuranceHighlightedIndex(null);
                                }
                                return next;
                            })}
                            onFocusCapture={() => {
                                setInsuranceOpen(true);
                                setIsOpen(false);
                                setHighlightedIndex(null);
                                setCityOpen(false);
                                setCityHighlightedIndex(null);
                            }}
                            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                            aria-label="Abrir lista de convênios"
                        >
                            <ChevronDown size={18} />
                        </button>

                        {insuranceOpen && (
                            <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                                <ul className="max-h-72 overflow-y-auto py-2 text-sm text-gray-700">
                                    {filteredInsuranceOptions.length === 0 && (
                                        <li className="px-5 py-3 text-gray-400">Nenhum convênio encontrado.</li>
                                    )}
                                    {filteredInsuranceOptions.map((option, index) => {
                                        const isHighlighted = index === insuranceHighlightedIndex;
                                        return (
                                            <li key={option}>
                                                <button
                                                    type="button"
                                                    onMouseEnter={() => setInsuranceHighlightedIndex(index)}
                                                    onMouseLeave={() => setInsuranceHighlightedIndex(null)}
                                                    onClick={() => handleInsuranceSelect(option)}
                                                    className={`flex w-full items-center justify-between px-5 py-3 text-left transition ${
                                                        isHighlighted ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-3">
                                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-500">
                                                            <ShieldCheck className="h-4 w-4" />
                                                        </span>
                                                        <span className="text-base font-medium">{option}</span>
                                                    </span>
                                                    <span className="text-xs uppercase tracking-wide text-gray-400">
                                                        Convênio
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                                <div className="border-t border-gray-100 bg-gray-50 px-5 py-2 text-center text-sm">
                                    <button
                                        type="button"
                                        className="font-medium text-blue-600 hover:text-blue-700"
                                        onClick={() => {
                                            setInsuranceQuery("");
                                            setInsuranceHighlightedIndex(null);
                                            setInsuranceOpen(true);
                                        }}
                                    >
                                        Todos os convênios
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Botão de Pesquisa */}
                <div className="flex items-end">
                    <input type="hidden" name="city" value={selectedCity ?? ""} />
                    <input type="hidden" name="state" value={selectedState ?? ""} />
                    <button
                        type="submit"
                        className="flex items-center gap-2 rounded-lg bg-[#5179EF] px-6 py-3 font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50"
                    >
                        <Search size={18} className="mr-1" />
                        <span>Pesquisar</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
