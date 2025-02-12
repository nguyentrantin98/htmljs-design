import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DropdownComponent from './DropdownComponent';
import { Client } from '../../lib';
import { fetchData, addData, updateData } from '../redux/genericSlice'; // Update to use the Redux Toolkit slice
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';

// Extend dayjs with the necessary plugins
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);

const USERACTIVE_KEY = 'usersactive';

const UserActive = () => {
    const dispatch = useDispatch();
    const taskNotification = useSelector(state => state.generic[USERACTIVE_KEY] || []); // Adjusted to use the slice state
    useEffect(() => {
        const fetchNotificationsData = async () => {
            const response = await Client.Instance.PostAsync({}, "/api/GetUserActive");
            dispatch(fetchData({ key: USERACTIVE_KEY, data: response }));
        };
        const handleUserConnectMessage = (data) => {
            fetchNotificationsData();
        };
        const handleUserDisConnectMessage = (data) => {
            fetchNotificationsData();
        };
        window.addEventListener("UserConnect", handleUserConnectMessage);
        window.addEventListener("UserDisconnect", handleUserDisConnectMessage);
        return () => {
            window.removeEventListener("UserConnect", handleUserConnectMessage);
            window.removeEventListener("UserDisconnect", handleUserDisConnectMessage);
        };
    }, [dispatch]);

    const toggleContent = (
        <>
            <i className="fal fa-user-friends"></i>
            <span className="badge">{taskNotification?.filter(x => !x.Read).length || ""}</span>
        </>
    );

    const dropdownContent = (
        <>
            <div className="menu-header">
                <a className="dropdown-item" href="#">User Active</a>
            </div>
            <div className="menu-content ps-menu" style={{ overflow: 'auto' }}>
                {taskNotification?.map((item, index) => (
                    <a
                        key={index}
                    >
                        <div className={`message-icon text-info`}>
                            <img className="message-icon" src={item.Avatar} />
                        </div>
                        <div className={`message-content`}>
                            <div className="header">
                                {item.NickName}
                            </div>
                            <div className="body">
                                {item.FullName}
                                <div className="time">{item.Ip}</div>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </>
    );

    return (
        <DropdownComponent
            toggleContent={toggleContent}
            dropdownContent={dropdownContent}
            classNameChild="md"
            className="notification dropdown"
        />
    );
};

export default UserActive;
