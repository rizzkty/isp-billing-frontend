import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({ options, value, onChange, placeholder = "Pilih Opsi...", className = "", darkMode = false, icon: Icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => 
        typeof opt === 'object' ? opt.value === value : opt === value
    );
    const displayValue = selectedOption ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption) : placeholder;

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div 
                className={`w-full p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${
                    darkMode 
                    ? 'bg-gray-800/80 border-gray-600 text-white hover:border-gray-500 hover:bg-gray-800' 
                    : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 focus:border-blue-500'
                } ${isOpen ? (darkMode ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-blue-500 ring-2 ring-blue-100') : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {Icon && <Icon className={`w-4 h-4 shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />}
                    <span className="font-medium truncate">{displayValue}</span>
                </div>
                <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : (darkMode ? 'text-gray-400' : 'text-gray-400')}`} />
            </div>

            <div className={`absolute z-[10000] w-full mt-2 rounded-xl shadow-2xl border overflow-hidden transition-all duration-200 origin-top ${isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'} ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
            }`}>
                <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
                    {options.length === 0 ? (
                        <div className={`px-3 py-2 text-sm text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Tidak ada opsi</div>
                    ) : (
                        options.map((option, idx) => {
                            const optValue = typeof option === 'object' ? option.value : option;
                            const optLabel = typeof option === 'object' ? option.label : option;
                            const isSelected = optValue === value;
                            
                            return (
                                <div 
                                    key={idx}
                                    className={`px-3 py-2.5 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                                        isSelected 
                                        ? (darkMode ? 'bg-blue-600/20 text-blue-400 font-bold' : 'bg-blue-50 text-blue-700 font-bold') 
                                        : (darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50')
                                    }`}
                                    onClick={() => {
                                        onChange(optValue);
                                        setIsOpen(false);
                                    }}
                                >
                                    <span className="truncate">{optLabel}</span>
                                    {isSelected && <Check className={`w-4 h-4 shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomSelect;
