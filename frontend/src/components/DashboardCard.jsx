function DashboardCard({ title, value }) {

    return (

        <div className="card shadow border-0">

            <div className="card-body">

                <h6 className="text-muted">
                    {title}
                </h6>

                <h2 className="fw-bold text-success">
                    {value ?? 0}
                </h2>

            </div>

        </div>

    );

}

export default DashboardCard;