sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/m/Dialog"
], function (Controller,MessageToast,  Dialog) {
	"use strict";

	return Controller.extend("com.sap.MLBS.controller.lookup", {

		onInit: function () {
			debugger;
			this.getView().byId("fileUploader").addStyleClass("fileUploaderStyle1");
		},


		handleValueChange: function (oEvent) {
			// keep a reference in the view to close it later
			var oBusyIndicator = new sap.m.BusyDialog();


			var oView = this.getView();

			var reader = new FileReader();
			reader.onloadend = function () {
				var model = oView.getModel().getData();
				model.image = reader.result;
				oView.getModel().refresh();
				oView.byId("fileUploader").addStyleClass("fileUploaderStyle2");
				oView.byId("uploadBox").setJustifyContent(null);
				oView.byId("flexBoxHint").setVisible(false);
				oView.byId("uploadBox").addStyleClass("workListBox2");
				oView.byId("vBoxImage").setVisible(true);
			};

			//this.setupModel(oView);

			reader.readAsDataURL(oEvent.getParameters().files[0]);
			this.callAPI(oEvent.getParameters().files[0],oView, oBusyIndicator);

		},

		callAPI: function (file,oView,oBusyIndicator) {

			var form = new FormData();
			form.append("files", file);
			//oBusyIndicator.open();


			//ML SERVICE ******************************
			var that = this;
			var accessToken = "";
			var clientId = "sb-0b665a0d-0f37-4867-b024-764d436e4a90!b6148|ml-foundation-xsuaa-std!b540";
			var clientSecret = "6N376YovKHvLrYWKlEjU4S5VZ9U=";
			var url1 = "/mltoken"
			var productImage = "";
			debugger;
			$.ajax({
				url: url1 + "?grant_type=client_credentials",
				type: "GET",
				contentType: "application/json",
				dataType: "json",
				async: false,
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa(clientId + ":" + clientSecret));
				},
				success: function (response) {
					accessToken = response.access_token;
				}

			});

			$.ajax({
				url: /mlservice/,
				type: "POST",
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
				},
				data: form,
				async: false,
				processData: false,
				contentType: false,
				success: function (data) {
					try {
						productImage = data.predictions[0].results[0].label;

								oView.getModel().refresh();
						//oBusyIndicator.close();


					} catch (err) {
					//	oBusyIndicator.close();
						//displays error message
						MessageToast.show("Caught - [ajax error] :" + err.message);
					}
				},
				error: function (request, status, error) {
					//oBusyIndicator.close();
					//displays error message
					MessageToast.show("Caught - [ajax error] :" + request.responseText);
				}
			});

			//Call HANA  ******************************

			var url2 = "/hanaservice/";
			var myfilter = "Notebook"; //productImage
			var productMaster = {};
			$.ajax({
				url: /hanaservice/ + "Products?$filter=name eq '" + productImage + "'",
				type: "GET",
				async: false,
				contentType: "application/json",
				dataType: "json",
				success: function (response) {
					if (response.d.results[0]) {
						productMaster.Id = response.d.results[0].Id;
						productMaster.name = response.d.results[0].name;
						productMaster.supplierName = response.d.results[0].supplierName;
						productMaster.category = response.d.results[0].category;
						productMaster.unitPrice = response.d.results[0].unitPrice;
						productMaster.unitsInStock = response.d.results[0].unitsInStock;

						var oView = that.getView();
						oView.byId("productID").setText(productMaster.Id);
						oView.byId("productName").setText(productMaster.name);
						oView.byId("supplierName").setText(productMaster.supplierName);
						oView.byId("category").setText(productMaster.category);
						oView.byId("unitPrice").setText(productMaster.unitPrice);
						oView.byId("unitsInStock").setText(productMaster.unitsInStock);

					}

				},
				//timeout: 5000
			});

			//BLOCKCHAIN SERVICE  ******************************
			var url3 = "/blockchaintoken"

			var clientId = "sb-ab6fdcd7-0d79-42b7-868d-78e3d468887f!b6148|na-420adfc9-f96e-4090-a650-0386988b67e0!b1836";
			var clientSecret = "A85k2lmxn5en0AMiVM74FYodWN4=";

			$.ajax({
				url: url3 + "?grant_type=client_credentials",
				type: "GET",
				contentType: "application/json",
				dataType: "json",
				async: false,
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Basic " + btoa(clientId + ":" + clientSecret));
				},
				success: function (response) {
					debugger;
					accessToken = response.access_token;
				},
				timeout: 5000
			});
			var filter1 = productImage.toLowerCase();
			var url4 = '/blockchainservice';
			var productReviews = {};
			$.ajax({
				url: url4 + "/" + filter1,
				type: "GET",
				beforeSend: function (xhr) {
					xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
				},
				async: false,
				success: function (data) {
					try {
						debugger;
						var results = data.values;
						var p1 = {
							reviews: []
						};

						for (var i in results) {
							var item = results[i];
							p1.reviews.push({
								"id": item.id,
								"location": item.location,
								"name": item.name,
								"rating": item.rating,
								"review": item.review,
								"product": item.product
							});
						}


						var oModel1 = new sap.ui.model.json.JSONModel(p1);
					oModel1.setDefaultBindingMode("TwoWay");
					that.getView().setModel(oModel1);

					} catch (err) {
						oBusyIndicator.close();
						//displays error message
						MessageToast.show("Caught - [ajax error] :" + err.message);
					}
				},
				error: function (request, status, error) {
					oBusyIndicator.close();
					//displays error message
					MessageToast.show("Caught - [ajax error] :" + request.responseText);
				}
			});

		},

		//draggableDialog: null,


		//navigation functions

		handleRouteMatched: function (oEvent) {
			var oParams = {};

			if (oEvent.mParameters.data.context) {
				this.sContext = oEvent.mParameters.data.context;
				var oPath;
				if (this.sContext) {
					oPath = {
						path: "/" + this.sContext,
						parameters: oParams
					};
					this.getView().bindObject(oPath);
				}
			}
		},








	});
});
