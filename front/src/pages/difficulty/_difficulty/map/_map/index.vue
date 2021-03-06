// パズル
<template lang="pug">
  .page
    loading.loading(v-if="ready.delay && !ready.puzzle")
    .ready(v-show="ready.puzzle")
      .modal-background(v-if="modal")
      .timer-area
        div(v-if="puzzle")
          count-up-timer(
            ref="timer"
            :do-run="run")
      .puzzle-area
        .hint-area(v-show="hint")
          .shadow
            img.completed-image(:src="completedImage")
        .puzzle(@click="puzzleStart")
          puzzle(
            ref="puzzle"
            v-if="puzzle"
            :difficulty="difficulty"
            :show-sar="showSar"
            :map-images="mapImages"
            :completed-image="completedImage"
            @ready="puzzleReady"
            @puzzleComplete="stopTimer"
            @pushComplete="pushComplete")
      br
      .sar
        p ボタンを押したら、
          br
          | 完成画像が見れるよ
      br
      .hint-button
        prs-button(
          @isPrs="dispHint"
          @isNotPrs="noDispHint"
          :src="require('~/assets/images/button/btn_btn_showimg.png')"
          :srcPrs="require('~/assets/images/button/btn_btn_prs_showimg.png')")
      br
      .giveup-button
        click-button(
        @onClick="openModal"
        :src="require('~/assets/images/button/btn_giveup.png')"
        :srcActive="require('~/assets/images/button/btn_prs_giveup.png')")
      retire-modal.modal-area(
        @close="closeModal"
        @retry="pushRetry"
        @top="pushTop"
        v-show="modal")
    jaxa.jaxa
</template>


<script>
import _ from 'lodash'
import Loading from '~/components/Loading'
import CountUpTimer from '~/components/CountUpTimer'
import RetireModal from '~/components/modal/Retire'
import PrsButton from '~/components/buttons/PrsButton'
import ClickButton from '~/components/buttons/ClickButton'
import Puzzle from '~/components/puzzle/Puzzle'
import Jaxa from '~/components/Jaxa'
import { mapGetters, mapActions } from 'vuex'
export default {
  validate ({ params }) {
    // 難易度チェック(easy, normal, hard以外は404)
    const d = params.difficulty
    const difficulty = (d === 'easy' || d === 'normal' || d === 'hard')
    if (!difficulty) {
      return false
    }

    // マップチェック（難易度に対応していないマップの場合は404）
    const selectedMap = this.selectedMap
    return selectedMap !== null
  },
  components: {
    Loading,
    CountUpTimer,
    RetireModal,
    PrsButton,
    ClickButton,
    Puzzle,
    Jaxa
  },
  data() {
    return {
      ready: {
        delay: false, // マップの準備が遅延しているか
        puzzle: false // マップの準備ができたか
      },
      run: false, // パズルを開始しているか
      modal: false, // モーダル表示制御用
      puzzle: true,
      hint: false, // ヒント表示制御用
      isComplete: false, // パズルが完成したか
      difficultyMap: { // 難易度と画像分割数との対応
        easy: 3,
        normal: 4,
        hard: 5,
      },
      difficulty: 'normal',
      map: 'lake-biwako'
    }
  },
    asyncData(context) {
    return {
      difficulty: context.params.difficulty,
      map: context.params.map
    }
  },
  created () {
    this.setVersion(-1)
  },
  mounted () {
    // 2秒以上遅延する場合はloadingを表示する
    setTimeout(() => {
      this.ready.page = true
    }, 2000)
  },
  updated () {
    if (!this.puzzle) {
      this.puzzle = true
    }
  },
  methods: {
    ...mapActions({
      updateBestRecords: 'updateBestRecords',
      setBestRecord: 'setBestRecord',
      setIsNewRecord: 'setIsNewRecord',
      setVersion: 'setVersion',
    }),
    puzzleReady () {
      // パズルの準備ができたことを検知
      this.ready.puzzle = true
    },
    puzzleStart () {
      this.run = true
    },
    stopTimer () { // タイマー停止処理
      this.run = false // タイマーを停止する

      // 難易度・マップに対応する新記録を取得する
      const difficulty = this.difficulty
      const map = this.map
      const best = this.bestRecords.find(v => {
        return v.difficulty === difficulty && v.map === map
      })

      // 初回の場合
      if (!best) {
        // 記録を新記録として登録
        this.updateBestRecords({
          difficulty: difficulty,
          map: map,
          min: this.min,
          sec: this.sec
        })
        // ベストレコードにはnullを設定する
        this.setBestRecord(null)
        this.setIsNewRecord(true)
        return
      }

      // 新記録の場合
      if (this.min < best.min || 
        (this.min === best.min && this.sec < best.sec)) {
        // 新記録を登録する
        this.updateBestRecords({
          difficulty: difficulty,
          map: map,
          min: this.min,
          sec: this.sec
        })
        this.setIsNewRecord(true)
        this.setBestRecord({ min: this.min, sec: this.sec })
      } else {
        this.setIsNewRecord(false)
        this.setBestRecord({ min: best.min, sec: best.sec })
      }
    },
    pushComplete () { // 完成画面に遷移する
      const difficulty = this.difficulty
      const map = this.map
      this.$router.push('/difficulty/'+difficulty+'/map/'+map+'/complete')
    },
    openModal() { // モーダルを表示する
      this.modal = true // モーダルを表示する
      this.run = false // タイマーを停止する
    },
    closeModal() { // モーダルを非表示にする
      this.modal = false // モーダルを非表示にする
      this.run = true // タイマーを起動する
    },
    pushRetry() { // TODO:
      this.modal = false
      this.run = false
      this.$refs.puzzle.reset()
      this.puzzle = false
    },
    pushTop() { // TOPに遷移する
      this.$router.push('/')
    },
    dispHint () { // ヒントを表示する
      this.hint = true // ヒントを表示する
      // ヒントを表示したらペナルティでカウントアップする処理
      for (let i = 0; i < 3; i++) { // 3秒カウントアップする
        this.$refs.timer.countUp()
      }
    },
    noDispHint () { // ヒントを非表示にする
      this.hint = false // ヒントを非表示にする処理
    },
    targetSec (sec) { // SAR画像を表示する時間の判定
      if (15 <= sec && sec <= 19) {
        return false
      }
      if (35 <= sec && sec <= 39) {
        return false
      }
      if (55 <= sec && sec <= 59) {
        return false
      }
      return true
    }
  },
  computed: {
    ...mapGetters({
      min: 'min',
      sec: 'sec',
      bestRecords: 'bestRecords',
      bestRecord: 'bestRecord',
      puzzles: 'puzzles'
    }),
    // SAR画像を表示する時間を指定
    showSar () {
      const sec = this.sec
      return this.targetSec(sec)
    },
    // 選択したマップを返す（不正な値の場合はnull）
    selectedMap () {
      const m = this.puzzles
      const selected = m.filter(v => {
        return v.id === this.map
      })
      if (!selected) {
        return null
      }
      if (selected.length !== 1) {
        return null
      }
      return selected[0]
    },
    mapImages () { // 使用する画像の情報を取得する
      const parameters = this.selectedMap.parameters
      const parameter =  parameters.filter(v => {
        return (v.split_n === this.difficultyMap[this.difficulty])
      })

      if (!parameter) { // validateで確認済み
        return null
      }
      if (parameter.length !== 1) { // validateで確認済み
        return null
      }

      const p = parameter[0]
      const kind = p.kind
      const x = p.x
      const y = p.y
      const z = p.z
      const n = p.split_n

      return `${kind}/${z}-${x}-${y}-${n}`
    },
    completedImage () { // 完成画像のパスを取得する
      return `/images/${this.mapImages}/sar/completed.png`
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  width: 640px;
  height: 1148px;
  background-image:
    url('~assets/images/moon/img_pzlmoon.png'),
    url('~assets/images/background/moon/background-2.png'),
    url('~assets/images/background/background.png');
  background-position: 0 0, center 648px, center center;
  background-size: initial, 1902px, contain;
  background-repeat: no-repeat, no-repeat, no-repeat;

  .loading {
    width: 640px;
    height: 1148px;
    background-image:
      url('~assets/images/background/loadingearth.png'),
      url('~assets/images/background/background.png');
    background-position: center 648px, center center;
    background-size: contain, contain;
    background-repeat: no-repeat, no-repeat;
  }

  .ready {
    .modal-background {
      position: absolute;
      width: 640px;
      height: 1149px;
      background-color: #10172b;
      opacity: 0.6;
    }

    .timer-area {
      padding-top: 50px;
      width: 256px;
    }

    .puzzle-area {
      padding-top: 30px;
      padding-left: 48px;
      width: 540px;
      height: 540px;

      .hint-area {
        position: absolute;
        z-index: 30;
        width: 540px;
        height: 540px;
        border: inset 20px #5d41f3;
        border-radius: 8px;

        .shadow {
          position: relative;
          width: 500px;
          height: 500px;
          border: solid 10px #192342;

          .completed-image {
            width: 480px;
            height: 480px;
            background-color: white;
            text-align: center;
            filter: brightness(200%);
            -webkit-filter: brightness(200%);
            -moz-filter: brightness(200%);
            -o-filter: brightness(200%);
            -ms-filter: brightness(200%);
          }
        }
      }

      .puzzle {
        width: 540px;
        height: 540px;
      }
    }

    .sar {
      position: relative;
      margin-left: 20px;
      padding-top: 70px;
      height: 60px;
      color: #192342;
      text-align: center;
      letter-spacing: normal;
      font-weight: normal;
      font-style: normal;
      font-stretch: normal;
      font-size: 24px;
      font-family: NotoSansCJKjp;
      line-height: 1.5;

      &::before {
        position: absolute;
        top: 66px;
        left: 138px;
        width: 31px;
        height: 74px;
        border-left: solid #192342;
        border-left-width: 2px;
        content: "";
        transform: rotate(-22deg);
      }

      &::after {
        position: absolute;
        top: 78px;
        left: 462px;
        width: 31px;
        height: 74px;
        border-left: solid #192342;
        border-left-width: 2px;
        content: "";
        transform: rotate(22deg);
      }
    }

    .hint-button {
      margin-top: 80px;
      text-align: center;
    }

    .giveup-button {
      margin-top: 10px;
      text-align: center;
    }

    .modal-area {
      position: absolute;
      z-index: 40;
    }
  }

  .jaxa {
    position: absolute;
    top: 1110px;
    left: 530px;
    color: #5b6277;
  }
}
</style>
