 window.ChaiBioTech.ngApp
 .controller 'UserSettingsCtrl', [
   '$scope'
   '$window'
   '$modal'
   'User'
   ($scope, $window, $modal, User) ->

     angular.element('body').addClass 'modal-form'
     $scope.$on '$destroy', ->
       angular.element('body').removeClass 'modal-form'

     $scope.settings =
       option: 'A'
       checkbox: true

     $scope.goHome = ->
       $window.location = '#home'

     fetchUsers = ->
       User.fetch().then (users) ->
         $scope.users = users

     fetchUsers()

     $scope.currentUser = User.currentUser()

     User.getCurrent().then (data) ->
       $scope.loggedInUser = data.data.user
       console.log data.data.user

     $scope.user = {}

     $scope.changeUser = (index)->
       $scope.selectedUser = $scope.users[index].user;
       User.selectedUSer = $scope.users[index].user;
       console.log "clciked", $scope.selectedUser


     $scope.addUser = ->
       user = angular.copy $scope.user
       user.role = if $scope.user.role then 'admin' else 'default'
       User.save(user)
       .then ->
         $scope.user = {}
         fetchUsers()
         $scope.modal.close()
       .catch (data) ->
         data.user.role = if data.user.role is 'default' then false else true
         $scope.user.errors = data.user.errors

     $scope.removeUser = (id) ->
       if $window.confirm 'Are you sure?'
         User.remove(id).then fetchUsers

     $scope.openAddUserModal = ->
       $scope.modal = $modal.open
         scope: $scope
         templateUrl: 'app/views/user/modal-add-user.html'

 ]
