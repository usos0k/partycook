(function () {
  'use strict';

  angular
    .module('users')
    .controller('ChangeProfilePictureController', ChangeProfilePictureController);

  ChangeProfilePictureController.$inject = ['$timeout', 'Authentication', 'Upload', 'Notification', '$http'];

  function ChangeProfilePictureController($timeout, Authentication, Upload, Notification, $http) {
    var vm = this;
    vm.user = Authentication.user;
    console.log(vm.user);
    vm.progress = 0;

    vm.upload = function (dataUrl) {

      Upload.upload({
        url: '/api/users/picture',
        data: {
          newProfilePicture: dataUrl
        }
      }).then(function (response) {
        $timeout(function () {
          onSuccessItem(response.data);
        });
      }, function (response) {
        if (response.status > 0) onErrorItem(response.data);
      }, function (evt) {
        vm.progress = parseInt(100.0 * evt.loaded / evt.total, 10);
      });
    };
    vm.delete = function (item) {
      var confirmBoolean = confirm('정말 삭제하시겠습니까?');
      if(confirmBoolean){
        $http.post('/api/users/picture/delete',{picture: item}).then(function (response) {
          vm.user = response.data;
        })
      }
    };

    // Called after the user has successfully uploaded a new picture
    function onSuccessItem(response) {
      // Show success message
      Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Successfully changed profile picture' });

      // Populate user object
      vm.user = Authentication.user = response;

      // Reset form
      // vm.fileSelected = false;
      vm.progress = 0;
    }

    // Called after the user has failed to upload a new picture
    function onErrorItem(response) {
      // vm.fileSelected = false;
      vm.progress = 0;

      // Show error message
      Notification.error({ message: response.message, title: '<i class="glyphicon glyphicon-remove"></i> Failed to change profile picture' });
    }
  }
}());
