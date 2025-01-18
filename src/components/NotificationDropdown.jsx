import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DropdownComponent from './DropdownComponent';
import { ChromeTabs, ComponentExt } from '../../lib';
import { Client } from '../../lib';
import { Toast } from '../../lib/toast';
import { fetchData, addData, updateData } from '../redux/genericSlice'; // Update to use the Redux Toolkit slice
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';

// Extend dayjs with the necessary plugins
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);

const NOTIFICATION_KEY = 'notifications';

const NotificationDropdown = () => {
    const dispatch = useDispatch();
    const taskNotification = useSelector(state => state.generic[NOTIFICATION_KEY] || []); // Adjusted to use the slice state

    useEffect(() => {
        // Fetch notifications data on component mount
        const fetchNotificationsData = async () => {
            const response = await Client.Instance.PostAsync({}, "/api/feature/mynotification");
            dispatch(fetchData({ key: NOTIFICATION_KEY, data: response }));
        };

        fetchNotificationsData();

        // Event listener for message notifications
        const handleMessage = (data) => {
            const message = data.detail.Message;
            const index = 0;
            dispatch(addData({ key: NOTIFICATION_KEY, item: message, index }));
            Toast.Success(message.Title);

            if (typeof (Notification) !== 'undefined' && Notification.permission === "granted") {
                showNativeNtf(message);
            } else if (typeof (Notification) !== 'undefined' && Notification.permission !== "denied") {
                Notification.requestPermission().then((permission) => {
                    if (permission === 'granted') {
                        showNativeNtf(message);
                    }
                });
            } else {
                Toast.Success(message.Title);
            }
        };

        const showNativeNtf = (task) => {
            const nativeNtf = new Notification(task.Title, {
                body: task.Description,
                icon: task.Attachment || "./rocket-round-icon-dfb12b.webp",
                vibrate: [200, 100, 200],
                badge: "./rocket-round-icon-dfb12b.webp"
            });
            nativeNtf.addEventListener('click', () => handleClick(task));
            setTimeout(() => {
                nativeNtf.close();
            }, 7000);
        };

        window.addEventListener("MessageNotification", handleMessage);
        return () => {
            window.removeEventListener("MessageNotification", handleMessage);
        };
    }, [dispatch]);


    const getFeatureNameFromUrl = () => {
        let hash = window.location.hash;

        if (hash.startsWith("#/")) {
            hash = hash.replace("#/", "");
        }

        if (!hash.trim() || hash == undefined) {
            return null;
        }

        let [pathname, queryString] = hash.split("?");
        let params = new URLSearchParams(queryString);

        return {
            pathname: pathname || null,
            params: Object.fromEntries(params.entries())
        };
    }

    const handleClick = async (taskNotifi) => {
        var prams = getFeatureNameFromUrl();
        if (taskNotifi.VoucherTypeId == 1) {
            var inquiryDetail = await Client.Instance.GetByIdAsync(taskNotifi.EntityId, [taskNotifi.RecordId]);
            if (!inquiryDetail.data) {
                Toast.Warning("Record not exists!");
            }
            else {
                var inquiry = await Client.Instance.GetByIdAsync("Inquiry", [inquiryDetail.data[0].InquiryId]);
                var tabChrome = ChromeTabs.tabs.find(x => x.content.Meta.Name == "inquiry");
                if (!tabChrome) {
                    ComponentExt.InitFeatureByName("Inquiry", true).then(tab => {
                        window.setTimeout(() => {
                            tab.OpenPopup("inquiry-editor", inquiry.data[0])
                        }, 1000);
                    });
                }
                else {
                    if (prams.params.Id != inquiry.data[0].Id) {
                        tabChrome.content.Focus();
                        var popup = tabChrome.content.Children.find(x => x.Popup);
                        if (popup) {
                            popup.Dirty = false;
                            popup.Dispose();
                        }
                        tabChrome.content.OpenPopup("inquiry-editor", inquiry.data[0])
                    }
                }
            }
        }
        else if (taskNotifi.VoucherTypeId == 8) {
            var inquiryDetail = await Client.Instance.GetByIdAsync(taskNotifi.EntityId, [taskNotifi.RecordId]);
            if (!inquiryDetail.data) {
                Toast.Warning("Record not exists!");
            }
            else {
                var tabChrome = ChromeTabs.tabs.find(x => x.content.Meta.Name == "advance-request");
                if (!tabChrome) {
                    ComponentExt.InitFeatureByName("advance-request", true).then(tab => {
                        window.setTimeout(() => {
                            tab.OpenPopup("advance-request-editor", inquiryDetail.data[0])
                        }, 1000);
                    });
                }
                else {
                    if (prams.params.Id != inquiryDetail.data[0].Id) {
                        tabChrome.content.Focus();
                        var popup = tabChrome.content.Children.find(x => x.Popup);
                        if (popup) {
                            popup.Dirty = false;
                            popup.Dispose();
                        }
                        tabChrome.content.OpenPopup("advance-request-editor", inquiryDetail.data[0])
                    }
                }
            }
        }
        else if (taskNotifi.VoucherTypeId == 9) {
            var inquiryDetail = await Client.Instance.GetByIdAsync(taskNotifi.EntityId, [taskNotifi.RecordId]);
            if (!inquiryDetail.data) {
                Toast.Warning("Record not exists!");
            }
            else {
                var tabChrome = ChromeTabs.tabs.find(x => x.content.Meta.Name == "advance-request");
                if (!tabChrome) {
                    ComponentExt.InitFeatureByName("advance-request", true).then(tab => {
                        window.setTimeout(() => {
                            tab.OpenPopup("reimbursement-form-editor", inquiryDetail.data[0])
                        }, 1000);
                    });
                }
                else {
                    if (prams.params.Id != inquiryDetail.data[0].Id) {
                        tabChrome.content.Focus();
                        var popup = tabChrome.content.Children.find(x => x.Popup);
                        if (popup) {
                            popup.Dirty = false;
                            popup.Dispose();
                        }
                        tabChrome.content.OpenPopup("reimbursement-form-editor", inquiryDetail.data[0])
                    }
                }
            }
        }
        else if (taskNotifi.VoucherTypeId == 3) {
            var entity = await Client.Instance.GetByIdAsync(taskNotifi.EntityId, [taskNotifi.RecordId]);
            if (!entity.data) {
                Toast.Warning("Record not exists!");
            }
            else {
                var featureName = "sea-booking-local";
                var featureDetailName = "sea-booking-local-editor";
                if (entity.data[0].TypeId == 7) {
                    featureName = "air-booking-local";
                    featureDetailName = "air-booking-local-editor";
                }
                else if (entity.data[0].TypeId == 8) {
                    featureName = "trucking-booking-local";
                    featureDetailName = "trucking-booking-local-editor";
                }
                else if (entity.data[0].TypeId == 9) {
                    featureName = "logistics-booking-local";
                    featureDetailName = "logistics-booking-local-editor";
                }
                var tabChrome = ChromeTabs.tabs.find(x => x.content.Meta.Name == featureName);
                if (!tabChrome) {
                    ComponentExt.InitFeatureByName(featureName, true).then(tab => {
                        window.setTimeout(() => {
                            tab.OpenPopup(featureDetailName, entity.data[0])
                        }, 1000);
                    });
                }
                else {
                    if (prams.params.Id != entity.data[0].Id) {
                        tabChrome.content.Focus();
                        var popup = tabChrome.content.Children.find(x => x.Popup);
                        if (popup) {
                            popup.Dirty = false;
                            popup.Dispose();
                        }
                        tabChrome.content.OpenPopup(featureDetailName, entity.data[0])
                    }
                }
            }
        }
        if (taskNotifi.Read) {
            return;
        }
        dispatch(updateData({ key: NOTIFICATION_KEY, item: { ...taskNotifi, Read: !taskNotifi.Read } }));
        const changes = [
            { Field: "Id", Value: taskNotifi.Id },
            { Field: "Read", Value: "1" }
        ];
        const patch = {
            Table: "TaskNotification",
            Changes: changes
        };
        Client.Instance.PatchAsync(patch).then();
    };

    const toggleContent = (
        <>
            <i className="far fa-bell"></i>
            <span className="badge">{taskNotification?.filter(x => !x.Read).length || ""}</span>
        </>
    );

    const dropdownContent = (
        <>
            <div className="menu-header">
                <a className="dropdown-item" href="#">Notification</a>
            </div>
            <div className="menu-content ps-menu" style={{ overflow: 'auto' }}>
                {taskNotification?.map((item) => (
                    <a
                        key={item.Id}
                        onClick={(e) => {
                            e.preventDefault();
                            handleClick(item);
                        }}
                    >
                        <div className={`message-icon ${item.Read ? 'text-secondary' : 'text-info'}`}>
                            <i className={item.Icon || "fas fa-info"}></i>
                        </div>
                        <div className={`message-content ${item.Read ? 'read' : ''}`}>
                            <div className="header">
                                {item.Title}
                            </div>
                            <div className="body">
                                {item.Description}
                            </div>
                            <div className="time">{dayjs(item.InsertedDate).format('DD/MM HH:mm')}</div>
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

export default NotificationDropdown;
