import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const DropdownComponent = ({ toggleContent, dropdownContent, className, classNameChild }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const dropdownRef = useRef(null);
    const toggleRef = useRef(null);

    const toggleDropdown = () => {
        if (!dropdownOpen && toggleRef.current) {
            const rect = toggleRef.current.getBoundingClientRect();
            setDropdownPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
        }
        setDropdownOpen(!dropdownOpen);
    };

    const closeDropdown = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target) && !toggleRef.current.contains(e.target)) {
            setDropdownOpen(false);
        }
    };

    useEffect(() => {
        if (dropdownOpen) {
            const handleResize = () => {
                if (dropdownRef.current && toggleRef.current) {
                    const rect = toggleRef.current.getBoundingClientRect();
                    const dropdownRect = dropdownRef.current.getBoundingClientRect();
                    
                    // Kiểm tra xem dropdown có vượt qua bên phải màn hình không
                    const leftPosition = rect.left + dropdownRect.width > window.innerWidth
                        ? rect.right - dropdownRect.width + window.scrollX
                        : rect.left + window.scrollX;
                    
                    setDropdownPosition({
                        top: rect.bottom + window.scrollY,
                        left: leftPosition,
                    });
                }
            };

            document.addEventListener('mousedown', closeDropdown);
            window.addEventListener('resize', handleResize);
            handleResize(); // Cập nhật vị trí khi mở dropdown lần đầu

            return () => {
                document.removeEventListener('mousedown', closeDropdown);
                window.removeEventListener('resize', handleResize);
            };
        }
    }, [dropdownOpen]);

    return (
        <>
            <div
                className={`dropdown ${dropdownOpen ? 'show' : ''} ${className}`}
                ref={toggleRef}
                style={{ position: 'relative' }}
            >
                <a
                    onClick={toggleDropdown}
                    aria-expanded={dropdownOpen}
                    style={{ display: 'flex', alignItems: 'center' }}
                >
                    {toggleContent}
                </a>
            </div>
            {dropdownOpen &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        className={`dropdown-menu dropdown-menu-right dropdown-menu-icon-list ${dropdownOpen ? 'show' : ''} ${classNameChild}`}
                        style={{
                            position: 'absolute',
                            top: dropdownPosition.top,
                            left: dropdownPosition.left,
                            opacity: '1',
                            transition: 'all 0.13s ease',
                            zIndex: 1000,
                        }}
                    >
                        {dropdownContent}
                    </div>,
                    document.body
                )}
        </>
    );
};

export default DropdownComponent;