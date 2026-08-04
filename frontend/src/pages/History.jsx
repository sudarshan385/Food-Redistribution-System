import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

function History() {

    const [history, setHistory] = useState([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {

        try {

            const response = await api.get("/history");

            setHistory(response.data.history);

        } catch (error) {

            console.log(error);

        }

    };

    return (

        <div className="container-fluid">

            <div className="row">

                <div className="col-md-2">
                    <Sidebar />
                </div>

                <div className="col-md-10 p-4">

                    <h2 className="mb-4">
                        Transaction History
                    </h2>

                    <table className="table table-bordered table-hover">

                        <thead className="table-dark">

                        <tr>

                            <th>ID</th>

                            <th>User</th>

                            <th>Food</th>

                            <th>Action</th>

                            <th>Date & Time</th>

                        </tr>

                        </thead>

                        <tbody>

                        {history.map(item => (

                            <tr key={item.transaction_id}>

                                <td>{item.transaction_id}</td>

                                <td>{item.name}</td>

                                <td>{item.food_name}</td>

                                <td>

                                    {item.action === "ADD FOOD" &&
                                        <span className="badge bg-success">
                                            {item.action}
                                        </span>
                                    }

                                    {item.action === "UPDATE FOOD" &&
                                        <span className="badge bg-warning text-dark">
                                            {item.action}
                                        </span>
                                    }

                                    {item.action === "DELETE FOOD" &&
                                        <span className="badge bg-danger">
                                            {item.action}
                                        </span>
                                    }

                                </td>

                                <td>
                                    {new Date(item.created_at).toLocaleString()}
                                </td>

                            </tr>

                        ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>

    );

}

export default History;