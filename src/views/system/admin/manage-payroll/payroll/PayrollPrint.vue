<template>
  <v-row dense no-gutters>
    <v-col cols="12" sm="9" class="d-flex justify-center align-center">
      <v-img src="/image-header-title.png"></v-img>
    </v-col>
    <v-col cols="12" sm="3" class="d-flex justify-center align-center">
      <h1 class="text-h5 font-weight-black text-primary">PAY SLIP</h1>
    </v-col>
  </v-row>

  <table class="mt-6 text-caption w-100">
    <tbody>
      <tr>
        <td>PAID TO</td>
        <td class="border-b-md w-66 ps-5">Juan Dela Cruz</td>
        <td>POSITION</td>
        <td class="border-b-md w-25 ps-5">Software Engineer</td>
      </tr>
      <tr>
        <td>ADDRESS</td>
        <td class="border-b-md w-66 ps-5">Butuan City</td>
        <td>DATE</td>
        <td class="border-b-md w-25 ps-5">February 26, 2025</td>
      </tr>
    </tbody>
  </table>

  <table class="mt-3 text-caption border-md w-100" style="border-collapse: collapse">
    <tbody>
      <tr>
        <td class="text-center border-b-md" colspan="4">PARTICULARS</td>
        <td class="text-center border-b-md border-s-md">AMOUNT</td>
      </tr>
      <tr>
        <td class="border-b-sm text-center">5</td>
        <td>Days Regular Work for chuchuchu</td>
        <td>@ 410.00</td>
        <td>/Day</td>
        <td class="border-b-sm border-s-md text-end">6150.00</td>
      </tr>
      <tr>
        <td colspan="2"></td>
        <td class="text-caption font-weight-bold">Gross Salary</td>
        <td class="text-caption font-weight-bold text-end">Php</td>
        <td class="border-b-sm border-s-md text-end"></td>
      </tr>
      <tr>
        <td colspan="2"></td>
        <td class="text-caption">Less Deductions</td>
        <td></td>
        <td class="border-b-sm border-s-md text-end"></td>
      </tr>
      <tr>
        <td colspan="2"></td>
        <td class="text-caption font-weight-bold border-t-md border-s-md">TOTAL NET SALARY</td>
        <td class="border-t-md"></td>
        <td class="border-t-md border-s-md text-end"></td>
      </tr>
    </tbody>
  </table>
</template>
