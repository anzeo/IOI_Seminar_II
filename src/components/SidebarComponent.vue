<template>
  <VueSidePanel v-model="isOpen" width="400px" header-class="custom-header" body-class="overflow-hidden"
                hide-close-btn>
    <template #header>
      <h2 style="flex: 1" class="my-2">Song tutorials</h2>
      <div class="vsp-close" style="position: relative; top: 0" @click="isOpen = false"><span class="vsp-close__x"></span></div>
    </template>
    <div style="height: 100%; margin-left: 1rem; display: flex; flex-direction: column">
      <h6 class="mb-3">Select a song to play</h6>

      <div style="flex: 1; overflow: scroll; height: 100%; margin-bottom: 1rem; overflow-x: hidden;">
        <b-table id="songsListTable" :items="songsList" :fields="['title']" hover striped @row-clicked="handleRowClick"></b-table>
      </div>
    </div>

  </VueSidePanel>
</template>

<script>

import {VueSidePanel} from "vue3-side-panel";

export default {
  name: "SidebarComponent",

  components: {VueSidePanel},

  props: {
    selectedInstrument: String
  },

  data() {
    return {
      isOpen: false,
      songsList: []
    }
  },

  watch: {
    selectedInstrument: function (newVal) {
      if (newVal) {
        import(`@/assets/songs/${newVal}_songs.json`).then(resp => {
          this.songsList = resp.default
          console.log(this.songsList)
        })
      }
    }
  },

  computed: {},

  methods: {
    toggle() {
      this.isOpen = !this.isOpen
    },

    handleRowClick(e) {
      this.$emit('songSelected', e)
      this.isOpen = false
    }
  }
}

</script>

<style>
.custom-header {
  display: flex;
  margin-left: 1rem;
  margin-bottom: .5rem;
  height: 60px;
  align-items: center;
  overflow: hidden !important;
}

#songsListTable {
  thead {
    display: none;
  }

  td {
    cursor: pointer;
  }
}
</style>