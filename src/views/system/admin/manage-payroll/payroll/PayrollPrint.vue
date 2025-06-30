<template>
  <v-row dense no-gutters>
    <v-col cols="12" sm="9" class="d-flex justify-center align-center">
      <v-img src="/image-header-title.png"></v-img>
    </v-col>
    <v-col cols="12" sm="3" class="d-flex justify-center align-center">
      <h1 class="text-h5 font-weight-black text-primary">PAY SLIP</h1>
    </v-col>
  </v-row>

  <v-table density="compact" class="mt-4 text-caption">
    <tbody>
      <tr>
        <td class="border-0 pa-0">PAID TO</td>
        <td class="border-b-md w-50">Juan Dela Cruz</td>
        <td class="border-0 pa-0">POSITION</td>
        <td class="border-b-md w-50">Software Engineer</td>
      </tr>
      <tr>
        <td class="border-0 pa-0">ADDRESS</td>
        <td class="border-b-md w-50">Butuan City</td>
        <td class="border-0 pa-0">DATE</td>
        <td class="border-b-md w-50">February 26, 2025</td>
      </tr>
    </tbody>
  </v-table>

  <v-table density="compact" class="mt-4 text-caption">
    <tbody>
      <tr>
        <td class="border-md pa-0 text-center" colspan="4">PARTICULARS</td>
        <td class="border-md pa-0 text-center">AMOUNT</td>
      </tr>
      <tr>
        <td class="border-b-md">5</td>
        <td>Days Regular Work for chuchuchu</td>
        <td>@ 410.00</td>
        <td>/Day</td>
        <td>6150.00</td>
      </tr>
    </tbody>
  </v-table>
</template>
