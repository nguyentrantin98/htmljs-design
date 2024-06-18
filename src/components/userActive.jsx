import { EditForm } from "../../lib"
import React from "react";

export class UserActive extends EditForm {
    Render() {
        this.Meta.Layout = () => (
            <>
                <div className="dropdown">
                    <button className="dropbtn">User Info</button>
                    <div className="dropdown-content">
                        <a href="#">Link 1</a>
                        <a href="#">Link 2</a>
                        <a href="#">Link 3</a>
                    </div>
                </div>
            </>
        );
        super.Render();
    }
}