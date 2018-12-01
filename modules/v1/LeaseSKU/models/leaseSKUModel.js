import mySqlConnection from "../../Services/mySQLConnection";

class LeaseSKUModel {
	getLeaseSKUMatrix = () => {
		const query = `select ServiceCode, ServiceName, HardwareCode, HardwareName, CountryCode, CountryName from LeaseSKUMatrix lsm
        JOIN Service ser ON ser.idService = lsm.ServiceId AND  lsm.isActive = 1
        JOIN Hardware hard ON hard.idHardware = lsm.HardwareId
        JOIN CountryHardwareMatrix chm ON chm.CountryId = lsm.CountryId AND chm.HardwareId = lsm.HardwareId AND chm.isActive = 1
        JOIN Country cont ON cont.idCountry = lsm.CountryId`;

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, (err, result) => {
				if (err) {
					console.log("Error for getLeaseMatrix in leaseSKUModel ", error);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result });
			});
		});
	};

	createLeaseSKU = (parameters) => {
		const query = "INSERT INTO LeaseSKU (LeaseSKUCode, LeaseSKUName)VALUES ?";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, [ parameters ], (err, result) => {
				console.log("Temp ", temp.sql);
				if (err) {
					console.log("Error for LeaseSKU in LeaseSKUModel ", err);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result });
			});
		});
	};
}

export default new LeaseSKUModel();
