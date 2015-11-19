"use strict";
(function () {
	angular
		.module('competitionForm', ['ui.router', 'formMessages'])
		.config(config)
		.directive('competitionForm', directive)


	function config($stateProvider) {
		$stateProvider
			.state('edit-competitons', {
				url: '/forms/competitions',
				template: '<competition-form></competition-form>'
			});
	}

	function directive() {
		return {
			templateUrl: 'app/components/user/forms/competitionsForm.html',
			controller: controller,
			controllerAs: "vm",
			bindToController: true
		}
	}

	function controller(UtilService, $state, competitionDataService, $scope, ridersDataService) {
		var vm = this;
		var limit = 100;
		vm.has_error = UtilService.has_error;
		vm.showForm = false;
		vm.team_id = "";
		vm.showMessage = false;
		if (!UtilService.isLogged())
			$state.go('login');

		init();

		function init() {
			competitionDataService.gettingCompetitions({
				limit: limit
			}).then(function (data) {
				vm.competitions = data;
			});
		}

		function addVictory(winner, season, competition) {
			season = parseInt(season);
			vm.riders.forEach(function (rider) {
				if (rider._id == winner) {
					var seasonFound = false;
					var competitionFound = false;
					rider.seasons.forEach(function (year, yearPos) {
						if (year.year == season) {
							var seasonFound = true;
							year.palmares.forEach(function (race, racePos) {
								if (race.competition == competition) {
									var competitionFound = true;
									vm.rider = new ridersDataService.rider();
									for (var propertyName in rider) {
										vm.rider[propertyName] = rider[propertyName];
									}
									vm.rider.seasons[yearPos].palmares[racePos].victories += 1;
								}
							});
							if (!competitionFound) {
								vm.rider = new ridersDataService.rider();
								for (var propertyName in rider) {
									vm.rider[propertyName] = rider[propertyName];
								}
								vm.rider.seasons[yearPos].palmares.push({
									competition: competition,
									position: null,
									victories: 1
								});
							}
						}
					});
					if (!seasonFound) {
						vm.rider = new ridersDataService.rider();
						for (var propertyName in rider) {
							vm.rider[propertyName] = rider[propertyName];
						}
						vm.rider.seasons.push({
							year: season,
							team: rider.team,
							palmares: [{
								competition: competition,
								position: null,
								victories: 1
							}]
						})
					}
					console.log(vm.rider);
				}
			});
		}

		function findWinnersChange() {
			vm.competition.seasons.forEach(function (season, seasonIndex) {
				season.stages.forEach(function (stage, stageIndex) {
					if (stage.winner != "-") {
						if (vm.competitionNoEdited.seasons[seasonIndex].stages[stageIndex].winner != stage.winner) {
							console.log("Añadimos victoria: " + stage.winner);
							//vm.rider = new ridersDataService.rider();
							addVictory(stage.winner, season.year, vm.competition._id);
							if (vm.competitionNoEdited.seasons[seasonIndex].stages[stageIndex].winner != "-") {
								console.log("Quitamos victoria: " + vm.competitionNoEdited[seasonIndex].stages[stageIndex].winner);
							}
						}
					}
				});
			});
		}

		function findRiders() {
			ridersDataService.gettingRiders({
					limit: 2000,
					skip: 0,
					sort: "_id",
				})
				.then(function (riders) {
					vm.riders = riders;
				});
		}

		vm.addForm = function () {
			findRiders();
			vm.competition = new competitionDataService.competitions();
			vm.showForm = true;
			vm.add = true;
		};

		vm.editForm = function (index) {
			findRiders();
			vm.competitionNoEdited = {};
			vm.competition = new competitionDataService.competition();
			for (var propertyName in vm.competitions[index]) {
				vm.competition[propertyName] = vm.competitions[index][propertyName];
			}
			vm.competitionNoEdited = JSON.parse(JSON.stringify(vm.competition));
			vm.showForm = true;
			vm.add = false;
		};

		vm.saveCompetition = function () {
			if (!vm.addCompetitionForm.$invalid) {
				if (vm.add) {
					vm.competition.$save();
					vm.competitions.push(vm.competition);
					vm.message = "Añadida competition: ";
				}
				vm.showMessage = true;
				vm.showForm = false;
			}
		}

		vm.editCompetition = function () {
			if (!vm.addCompetitionForm.$invalid) {
				findWinnersChange();
				if (!vm.add) {
					//vm.competition.$update();
					vm.message = "Editada competición: ";
					init();
				}
				vm.showMessage = true;
				vm.showForm = false;
			}
		}

		vm.removeCompetition = function (index) {
			vm.competition = new competitionDataService.competition();
			vm.competition._id = vm.competitions[index]._id;
			vm.competition.$delete().then(function () {
				vm.message = "Borrada competición: ";
				vm.showMessage = true;
				init();
			});
		}


	}
})();
