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
		const query = "INSERT INTO LeaseSKU (LeaseSKUCode, LeaseSKUName, Item1, Item2, Item3, Item4)VALUES ?";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(
				query,
				[
					parameters.map((item) => [
						item.LeaseSKUCode,
						item.LeaseSKUName,
						item.Item1,
						item.Item2,
						item.Item3,
						item.Item4
					])
				],
				(err, result) => {
					// console.log("Temp ", temp.sql);
					if (err) {
						console.log("Error for LeaseSKU in LeaseSKUModel ", err);
						return reject({ success: false, message: err });
					}
					return resolve({ success: true, data: result });
				}
			);
		});
	};

	getLeaseSKU = () => {
		const query = "SELECT LeaseSKUCode, LeaseSKUName, Item1, Item2, Item3, Item4 FROM LeaseSKU";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, (err, result) => {
				if (err) {
					console.log("Error for getLeaseSKU in leaseSKUModel ", error);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result });
			});
		});
	};
}

export default new LeaseSKUModel();
