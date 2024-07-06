import React, { useState } from 'react';

const UserDropdown = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    return (
        <div className={`dropdown dropdown-menu-end ${dropdownOpen ? 'show' : ''}`}>
            <a
                href="#"
                className="user-dropdown"
                onClick={toggleDropdown}
                aria-expanded={dropdownOpen}
            >
                <div className="label">
                    <span></span>
                    <div>Admin</div>
                </div>
                <img
                    className="img-user"
                    src="/assets/images/avatar1.png"
                    alt="user"
                    srcSet=""
                />
            </a>
            <ul className={`dropdown-menu small ${dropdownOpen ? 'show' : ''}`}>
                <li className="menu-content ps-menu">
                    <a href="#">
                        <div className="description">
                            <i className="bi bi-person"></i> Profile
                        </div>
                    </a>
                    <a href="#">
                        <div className="description">
                            <i className="bi bi-gear"></i> Setting
                        </div>
                    </a>
                    <a href="#">
                        <div className="description">
                            <i className="bi bi-power"></i> Logout
                        </div>
                    </a>
                </li>
            </ul>
        </div>
    );
};

export default UserDropdown;
