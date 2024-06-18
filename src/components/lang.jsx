import React, { useState, useEffect, useRef } from "react";
import './profile.css';

const Lang = () => {
    const [state, setState] = useState(false);
    const menuRef = useRef(null);

    const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            setState(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="action" ref={menuRef}>
            <div className="profile" onClick={() => setState(!state)}>
                ADMIN
            </div>
            <div className={state ? "menu active" : "menu"}>
                <h3>Someone Famous<br /><span>Website Designer</span></h3>
                <ul>
                    <li>
                        <img src="./assets/icons/user.png" alt="user icon" /><a href="#">My profile</a>
                    </li>
                    <li>
                        <img src="./assets/icons/edit.png" alt="edit icon" /><a href="#">Edit profile</a>
                    </li>
                    <li>
                        <img src="./assets/icons/envelope.png" alt="envelope icon" /><a href="#">Inbox</a>
                    </li>
                    <li>
                        <img src="./assets/icons/settings.png" alt="settings icon" /><a href="#">Setting</a>
                    </li>
                    <li>
                        <img src="./assets/icons/question.png" alt="question icon" /><a href="#">Help</a>
                    </li>
                    <li>
                        <img src="./assets/icons/log-out.png" alt="logout icon" /><a href="#">Logout</a>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default Lang;