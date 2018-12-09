import mySqlConnection from "../../Services/mySQLConnection";

class CartridgeModel {
	getCartridge = () => {
		const query = "Call getCartridge()";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, (err, result) => {
				if (err) {
					console.log("Error for getCartridge cartridgeModel ", err);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result[0] });
			});
		});
	};

	getSingleGas = () => {
		const query = "Call getSingleGas()";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, (err, result) => {
				if (err) {
					console.log("Error for getSingleGas in cartridgeModel ", err);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result[0] });
			});
		});
	};

	getMultiGas = () => {
		const query = "Call getMultiGas()";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, (err, result) => {
				if (err) {
					console.log("Error for getMultiGas in cartridgeModel ", err);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result[0] });
			});
		});
	};

	createCartridgeCombination = (parameters) => {
		const query =
			"INSERT INTO CartridgeCombination (CartridgeCombinationCode, CartridgeCombinationName, CartridgeGroupName) VALUES ?";
		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(
				query,
				[
					parameters.map((item) => [
						item.CartridgeCombinationCode,
						item.CartridgeCombinationName,
						item.CartridgeGroupName
					])
				],
				(err, result) => {
					// console.log("-------Temp ", temp.sql);
					if (err) {
						if (err.errno === 1062) {
							console.log("Duplicate entry error for ", parameters);
							return resolve({
								success: true,
								data: result,
								requestedCombination: parameters
							});
						} else {
							// console.log("Error for createCartridgeCobination in cartridgeModel ", err);
							return reject({
								success: false,
								message: err,
								requestedCombination: parameters
							});
						}
					}
					return resolve({
						success: true,
						data: result,
						requestedCombination: parameters
					});
				}
			);
		});
	};

	getCartridgeCombinationByCode = (cartridgeCombinationCode) => {
		const query = "Call getCartridgeCombinationByCode(?)";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, cartridgeCombinationCode, (err, result) => {
				if (err) {
					console.log("Error for getCartridgeCombinationByCode in cartridgeModel ", err);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result[0] });
			});
		});
	};

	getCartridgeCombination = () => {
		const query = "Call getCartridgeCombination()";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, (err, result) => {
				if (err) {
					console.log("Error for getCartridgeCombination in cartidgeModel ", err);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result[0] });
			});
		});
	};

	getCartridgeCombinationByGroupName = (parameters) => {
		const query = "Call getCartridgeCombinationByGroupName(?)";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, parameters, (err, result) => {
				if (err) {
					console.log("Error for getCartridgeCombinationByGroupName in cartidgeModel ", err);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result[0] });
			});
		});
	};

	getGasPrice = (parameters) => {
		const query = "Call getGasPrice(?)";

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, parameters, (err, result) => {
				if (err) {
					console.log("Error for getPrice in cartridgeModel ", err);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result[0] });
			});
		});
	};

	getCartridgeCurrency = (parameters) => {
		const query = "Call getCartridgeCurrency(?,?)";
		const queryParameters = [ parameters.quantity, parameters.CartridgeCode ];

		return new Promise((resolve, reject) => {
			const temp = mySqlConnection.query(query, queryParameters, (err, result) => {
				if (err) {
					console.log("Error for getCartridgeCurrency in cartridgeModel ", err);
					return reject({ success: false, message: err });
				}
				return resolve({ success: true, data: result });
			});
		});
	};
}

export default new CartridgeModel();
