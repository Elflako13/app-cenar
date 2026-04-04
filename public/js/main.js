// Auto-dismiss alerts after 4 seconds
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.alert-dismissible').forEach(alert => {
    setTimeout(() => {
      const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      bsAlert.close();
    }, 4000);
  });

  // Profile image preview
  const imgInput = document.getElementById('imgPreviewInput');
  const imgPreview = document.getElementById('imgPreview');
  if (imgInput && imgPreview) {
    imgInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) imgPreview.src = URL.createObjectURL(file);
    });
  }
});
