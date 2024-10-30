    sap.ui.define([
        "mt/fin/ap/ab/controller/BaseController",
        "sap/m/MessageBox",
        "sap/m/MessageToast",
        "sap/ui/core/Fragment",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/json/JSONModel"
    ], function(Controller,MessageBox,MessageToast,Fragment, Filter, FilterOperator,JSONModel) {
        'use strict';
        return Controller.extend("mt.fin.ap.ab.controller.Add", {
            onInit: function(){
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.getRoute("add").attachMatched(this.herculis, this);

                this.oLocalModel = new JSONModel();
                this.setDefaultData();
                this.getView().setModel(this.oLocalModel,"local");
            },
            productId: null,
            onLoadProduct: function(){
                //Step 1: read the data from model - product id
                this.productId = this.oLocalModel.getProperty("/prodData/PRODUCT_ID");
                //Step 2: get the odata model object
                var oDataModel = this.getView().getModel();
                //Step 3: ask SAP to load that single product data
                var that = this;
                that.getView().setBusy(true);
                oDataModel.read("/ProductSet('" + this.productId + "')",{
                    success: function(data){
                        //Step 4: success - set the data to local model
                        that.oLocalModel.setProperty("/prodData", data);
                        that.getView().setBusy(false);
                        that.setMode("Update");
                    },
                    error: function(){
                        that.getView().setBusy(false);
                    }
                });
                
            },
            mode: "Create",
            setMode: function(sMode){
                if(sMode === "Update"){
                    this.getView().byId("prodId").setEnabled(false);
                    this.getView().byId("idSave").setText("Update");
                }else{
                    this.getView().byId("prodId").setEnabled(true);
                    this.getView().byId("idSave").setText("Create");
                }
                this.mode = sMode;
            },
            onSave: function(){
                //Step 1: get the data to be posted = payload
                var payload = this.oLocalModel.getProperty("/prodData");
                //Step 2: Validate data - pre-checks
                if(!payload.PRODUCT_ID){
                    MessageBox.error("Oops! are you forgetting something 😒");
                    return "";
                }
                //Step 3: Get the odata model object
                var oDataModel = this.getView().getModel();
                //Step 4: fire the save to SAP - JS is Async non blocking IO
                if(this.mode === "Create"){
                    oDataModel.create("/ProductSet",payload,{
                        success: function(data){
                            //Step 5: success callback - data was posted
                            MessageToast.show("wahalla! you made it Amigo!");
                        },
                        error: function(oError){
                            //Step 6: error callback - issue in sap
                            MessageBox.error(JSON.parse(oError.responseText).error.innererror.errordetails[0].message);
                            debugger;
                        }
                    });
                }else{
                    oDataModel.update("/ProductSet('" + this.productId + "')",payload,{
                        success: function(data){
                            //Step 5: success callback - data was posted
                            MessageToast.show("wahalla! you updated it Amigo!");
                        },
                        error: function(oError){
                            //Step 6: error callback - issue in sap
                            MessageBox.error(JSON.parse(oError.responseText).error.innererror.errordetails[0].message);
                            debugger;
                        }
                    });
                }
                
                
                
            },
            onLoadExp: function(){
                //Step 1: get the category user choose on screen
                var category = this.oLocalModel.getProperty("/prodData/CATEGORY");
                //Step 2: get the odata model
                var oDataModel = this.getView().getModel();
                //Step 3: call the function import by also pass category
                var that = this;
                oDataModel.callFunction("/GetMostExpensiveProduct",{
                    urlParameters: {
                        "I_CATEGORY": category
                    },
                    success: function(data){
                        //Step 4: success - set the data to local model
                        that.oLocalModel.setProperty("/prodData", data);
                        that.getView().setBusy(false);
                        that.setMode("Update");
                    }
                });
                //Step 4: get callback data which we set to local model
            },
            oSupplierPopup: null,
            oField: null,
            onConfirm: function(oEvent){
                //Step 1: get selected item
                var oSelItem = oEvent.getParameter("selectedItem")
                //Step 2: get the value
                var sVal = oSelItem.getTitle();
                //Step 3: Set the data to field on which f4 was done
                this.oField.setValue(sVal);
                this.getView().byId("suppName").setText(oSelItem.getDescription());
            },
            onF4Help: function(oEvent){
                this.oField = oEvent.getSource();
                var that = this;
                if(!that.oSupplierPopup){
                    Fragment.load({
                        name: 'mt.fin.ap.ab.fragments.popup',
                        id: 'supplier',
                        controller: this
                    }).then(
                        //here in callback we cannot acces this pointer as controller object
                        //the only way to access controller object is to create a copy of it outside
                    function(oDialog){
                        that.oSupplierPopup = oDialog;   
                        that.oSupplierPopup.setMultiSelect(false);
                        that.oSupplierPopup.setTitle("Choose Supplier");
                        that.getView().addDependent(that.oSupplierPopup);
                        that.oSupplierPopup.bindAggregation("items",{
                            path: '/SupplierSet',
                            template: new sap.m.StandardListItem({
                                icon: 'sap-icon://supplier',
                                title: '{BP_ID}',
                                description: '{COMPANY_NAME}'
                            })
                        });   
                        that.oSupplierPopup.open();    
                    });
                }else{
                    that.oSupplierPopup.open();
                }
            },
            setDefaultData: function(){
                this.oLocalModel.setData({
                    "prodData": {
                        "PRODUCT_ID" : "",
                        "TYPE_CODE" : "PR",
                        "CATEGORY" : "Notebooks",
                        "NAME" : "",
                        "DESCRIPTION" : "",
                        "SUPPLIER_ID" : "0100000046",
                        "SUPPLIER_NAME" : "SAP",
                        "TAX_TARIF_CODE" : "1 ",
                        "MEASURE_UNIT" : "EA",
                        "PRICE" : "0.00",
                        "CURRENCY_CODE" : "EUR",
                        "DIM_UNIT" : "CM",
                        "PRODUCT_PIC_URL" : "/sap/public/bc/NWDEMO_MODEL/IMAGES/"
                    }
                });
            },
            onClear: function(){
                this.setDefaultData();
                this.setMode("Create");
            },
            herculis: function(oEvent){
                //TODO
            },
            onBack: function(){
                this.getView().getParent().to("idView1");
            }
        })
        
    });