<script setup>
import { onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const onUpload = () => {
  toast.add({ severity: 'success', summary: 'Success', detail: 'Emergency created', life: 3500 });
};

const alert = () => {
  toast.add({ severity: 'info', summary: 'Notifications', detail: 'Device pool notified', life: 4500 });
};

onMounted( () => {
  let i = 0;
  if (i == 0) {
    i = 1;
    var elem = document.getElementById("myBar");
    var width = 10;
    var id = setInterval(frame, 20);
    function frame() {
      if (width >= 100) {
        clearInterval(id);
        i = 0;
      } else {
        width++;
        elem.style.width = width + "%";
        elem.innerHTML = width + "%";
      }
    }
  }
   setTimeout( () => {
     onUpload();
  }, 2200);

   setTimeout( () => {
     alert();
  }, 4000);
})
</script>

<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <div id="myProgress">
          <div id="myBar">10%</div>
        </div>
      </div>
    </div>
    <Toast />
  </div>
</template>

<style>
#myProgress {
  width: 100%;
  background-color: #fafafa;
}

#myBar {
  width: 1%;
  min-height: 68vh;
  background-color: #696cf1;
  text-align: center; /* To center it horizontally (if you want) */
  line-height: 30px; /* To center it vertically */
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 6rem;
}
</style>