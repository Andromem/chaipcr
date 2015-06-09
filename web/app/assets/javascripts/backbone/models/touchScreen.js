ChaiBioTech.Models.Experiment = ChaiBioTech.Models.Experiment || {};

ChaiBioTech.Models.touchScreenModel = Backbone.Model.extend({
	
	url: "/experiments",

	defaults: {

		experiment: {
			name: "",
			protocol: {

			}
		}
	},

	initialize: function(){
		//_.bindAll(this ,"afterSave");
	},
	//There is many methods that uses $.ajax, so it can be in a single function 
	//but once experiment operations are done it can be done.
	saveData: function( action ) {
		that = this;
		if(action == "update") {
			var data = this.get("experiment");
			dataToBeSend = {"experiment":{"name": data["name"]}}
			$.ajax({
				url: "/experiments/"+data["id"],
				contentType: 'application/json',
				type: 'PUT',
				data: JSON.stringify(dataToBeSend)
			})
			.done(function(data) {
					console.log("Boom", data, that);
			})
			.fail(function() {
				console.log("Failed to update");
			})
		}else {
			this.save(null, { success: this.afterSave });
		}
	},

	createStep: function(step, place, id) {
		that = this;
		stage = step.options.parentStage.model;
		dataToBeSend = {};
		if(place == "before" && step.options.prev_id != null) {
			dataToBeSend = {"prev_id": step.options.prev_id};
		} else {
			dataToBeSend = {"prev_id": step.model.id}
		}

		console.log("Data To Server", dataToBeSend);
		$.ajax({
			url: "/stages/"+stage.id+"/steps",
			contentType: 'application/json',
			type: 'POST',
			data: JSON.stringify(dataToBeSend)
		})
		.done(function(data) {
			that.getLatestModel(id);
		})
		.fail(function() {
			alert("Failed to update");
			console.log("Failed to update");
		}); 
	},

	createStage: function(type, stageData, id) {
		that = this;
		var data = this.get("experiment");
		dataToBeSend = {
			"stage": {
				'stage_type': type
			}
		};
		dataToBeSend["prev_id"] = stageData.model.id;
		$.ajax({
			url: "/protocols/"+data.id+"/stages",
			contentType: 'application/json',
			type: 'POST',
			data: JSON.stringify(dataToBeSend)
		})
		.done(function(data) {
			that.getLatestModel(id);
		})
		.fail(function() {
			alert("Failed to update");
			console.log("Failed to update");
		}); 
	},

	getLatestModel: function(id) {
		that = this;
		$.ajax({
			url: "/experiments/"+id,
			contentType: 'application/json',
			type: 'GET'
		})
		.done(function(data) {
				console.log("Big bang", that);
				that.set('experiment', data["experiment"]);
		})
		.fail(function() {
			console.log("Failed to update");
		})
	},

	deleteStep: function(step, id) {
		console.log(step)
		that = this;
		$.ajax({
			url: "/steps/"+step.model.id,
			contentType: 'application/json',
			type: 'DELETE'
		})
		.done(function(data) {
			console.log(data);
			that.getLatestModel(id);
		})
		.fail(function() {
			alert("Failed to update");
			console.log("Failed to update");
		}); 
	},

	deleteStage: function(stage, id) {
		console.log("stage to be deleted", stage, stage.model.id);
		that = this;
		dataToBeSend = {
			id: stage.model.id
		};
		$.ajax({
			url: "/stages/"+stage.model.id,
			contentType: 'application/json',
			type: 'DELETE',
			data: JSON.stringify(dataToBeSend)
		})
		.done(function(data) {
			console.log(data);
			that.getLatestModel(id);
		})
		.fail(function() {
			alert("Failed to update");
			console.log("Failed to update");
		}); 
	},

	changeStageName: function(stageName, id, stageType) {
		dataToBeSend = {'stage':
							{
								'stage_type': stageType,
								'name': stageName
							}
						}
		$.ajax({
				url: "/stages/"+id,
				contentType: 'application/json',
				type: 'PUT',
				data: JSON.stringify(dataToBeSend)
			})
			.done(function(data) {
					console.log("Data updated from server", data, that);
			})
			.fail(function() {
				console.log("Failed to update");
			})
	},

	changeTemperature: function(newTemp, rampObj) {
		
		dataToBeSend = {'step':{'temperature': newTemp}}
		console.log(dataToBeSend)
		$.ajax({
				url: "/steps/"+rampObj.id,
				contentType: 'application/json',
				type: 'PUT',
				data: JSON.stringify(dataToBeSend)
			})
			.done(function(data) {
					console.log("Data updated from server woohaa" , data);
			})
			.fail(function() {
				console.log("Failed to update");
			})
	}
});
