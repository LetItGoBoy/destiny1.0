Page({
    data: {
      date: '', // 用户输入的日期
      time: '', // 用户输入的时间
      gender:'',
      bazi: {
        year: '',
        month: '',
        day: '',
        hour: ''
      }, // 由后端计算的八字结果
      forward:'',
      age:'',
      daYunList: [],
      daYunStartAges:[],
      daYunYears: [],
      tenGods: {},
    },
    onLoad: function (options) {
      // 获取从首页传来的日期和时间
      this.setData({
        date: options.date,
        time: options.time,
        gender: options.gender
      });
      
      // 提取年份和月份用于计算年柱
      const gender = this.data.gender;
      //console.log(gender)
      const date = new Date(this.data.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // JavaScript中月份是从0开始的
      const day = date.getDate();
      const time = this.data.time; 
      // 如果日期早于当年的2月4日，年份减1
      const adjustedYear = month < 2 || (month === 2 && day < 4) ? year - 1 : year;
          // 计算两个日期之间的天数差
      // 计算年柱
      this.calculateYearPillar(adjustedYear);
      this.calculateMonthPillar(year, month, day);
      this.calculateDailyStemBranch(year, month, day);
      this.calculateHourPillar(this.data.bazi.day,time);
      // 调用后端云函数计算八字排盘
      this.generateDaYun(gender,this.data.bazi.year,this.data.bazi.month);
      let birthDate = new Date(2024, month, day);
      this.calculateAgeBasedOnSolarTerms(birthDate,this.data.forward);
      const startingAge = this.data.age+1;
      const daYunCycles = 8; // Usually, there are 8 DaYun cycles
      let daYunStartAges = [];
      let daYunYears=[];
      for (let i = 0; i < daYunCycles; i++) {
        daYunStartAges.push(startingAge + i * 10);
        daYunYears.push(startingAge+year+i * 10)
      }
      this.setData({
        daYunStartAges: daYunStartAges,
        daYunYears:daYunYears,
      });
      this.calculateTenGods();
    },
    navigateToBaziCommentary: function() {
        const bazi = this.data.bazi;
        const url =`/pages/baziCommentary/baziCommentary?year=${bazi.year}&month=${bazi.month}&day=${bazi.day}&hour=${bazi.hour}`
        wx.navigateTo({
          url: url // Adjust the URL to match your file structure
        });
    },
    calculateAgeBasedOnSolarTerms:function (birthDate, forward) {
        // 假定的节气日期数据
        const solarTerms = {
            '立春': '2024-02-04', // 春季开始
            //'雨水': '2024-02-19', // 雨水增多，冰雪融化
            '惊蛰': '2024-03-06', // 春雷开始，惊醒冬眠的昆虫
            //'春分': '2024-03-21', // 昼夜平分
            '清明': '2024-04-05', // 清明节，扫墓祭祖
            //'谷雨': '2024-04-20', // 春雨贵如油，利于谷物生长
            '立夏': '2024-05-06', // 夏季开始
            //'小满': '2024-05-21', // 万物渐至小满
            '芒种': '2024-06-06', // 播种的季节
            //'夏至': '2024-06-21', // 白昼最长，夜晚最短
            '小暑': '2024-07-07', // 热气渐生，但未至最热
            //'大暑': '2024-07-23', // 最热的时期
            '立秋': '2024-08-08', // 秋季开始
            //'处暑': '2024-08-23', // 热气渐消
            '白露': '2024-09-08', // 白露为霜，秋季深入
            //'秋分': '2024-09-23', // 昼夜平分
            '寒露': '2024-10-08', // 比白露更冷，露水凝结
            //'霜降': '2024-10-23', // 霜开始降临
            '立冬': '2024-11-07', // 冬季开始
            //'小雪': '2024-11-22', // 开始下雪
            '大雪': '2024-12-07', // 雪量增多
            //'冬至': '2024-12-22', // 夜晚最长，白昼最短
            '小寒': '2025-01-06', // 寒冷开始加深
            //'大寒': '2025-01-20'  // 一年中最寒冷的时期
          };
        // 计算两个日期之间的天数差
        function daysBetween(startDate, endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          const diffTime = Math.abs(end - start);
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      
        // 寻找下一个或上一个节气的日期
        function findTermDate(birthDate, forward) {
          let termDates = Object.values(solarTerms).map(date => new Date(date));
          if (!forward) termDates = termDates.reverse();
          const birthDateTime = new Date(birthDate).getTime();
      
          for (let termDate of termDates) {
            if (forward && termDate.getTime() > birthDateTime) return termDate;
            if (!forward && termDate.getTime() < birthDateTime) return termDate;
          }
          // 如果没有找到，理论上不应该发生，返回出生日期
          return new Date(birthDate);
        }
      
        // 计算起大运的岁数
        function calculateDaYunAge(birthDate, forward) {
          const nextTermDate = findTermDate(birthDate, forward);
          const days = daysBetween(birthDate, nextTermDate);
          // 大运的天数转岁数计算
          let years = days / 3;
          // 不足1年的按四舍五入处理
          years = Math.round(years);
          return years;
        }
      
        // 使用以上定义的函数计算并返回起大运的岁数
        const years = calculateDaYunAge(birthDate, forward);
        this.setData({
            age: years // 更新到八字数据中的月柱
          });
    },
    generateDaYun:function (gender, yearStem, monthPillar) {
        // 干支数组，假设这是一个连续循环的数组
        const stemsAndBranches = [
            '甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉',
            '甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未',
            '甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳',
            '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸卯',
            '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑',
            '甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥'
        ];
    
        // 判断年干是阴是阳
        function isYang(yearStem) {
            // 阳干为：甲、丙、戊、庚、壬
            const yangStems = ['甲', '丙', '戊', '庚', '壬'];
            return yangStems.includes(yearStem.charAt(0));
        }
    
        // 确定大运的顺逆排
        const forward = (isYang(yearStem) && gender === 'male') || (!isYang(yearStem) && gender === 'female');
    
        let daYun = [];
        let index = stemsAndBranches.indexOf(monthPillar);
        for (let i = 0; i < 8; i++) { // 一般排八步大运
            if (forward) {
                index = (index + 1) % stemsAndBranches.length; // 顺行
            } else {
                index = (index - 1 + stemsAndBranches.length) % stemsAndBranches.length; // 逆行，确保不会是负数
            }
            daYun.push(stemsAndBranches[index]);
        }
        
        this.setData({
            forward:forward,
            daYunList: daYun // 更新到八字数据中的月柱
          });
    },
    calculateYearPillar: function (year) {
      // 天干地支数组
      const tianGan = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
      const diZhi = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  
      // 公元后年份的年干和年支计算
      let yearGanIndex = (year % 10) - 3;
      yearGanIndex = yearGanIndex > 0 ? yearGanIndex : yearGanIndex + 10;
      
      let yearZhiIndex = (year % 12) - 3;
      yearZhiIndex = yearZhiIndex > 0 ? yearZhiIndex : yearZhiIndex + 12;
  
      // 设置年柱
      const yearPillar = tianGan[yearGanIndex-1] + diZhi[yearZhiIndex-1];
      this.setData({
        'bazi.year': yearPillar // 同时更新到八字数据中的年柱
      });
    },
    calculateMonthPillar: function (year, month, day) {
        // 年干到月干的映射，这里只给出甲年的例子，其他年份的映射应该根据你的表格添加
        const yearToMonthMapping = {
            '甲': ['丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉', '甲戌', '乙亥', '丙子', '丁丑'],
            '乙': ['戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未', '甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑'],
            '丙': ['庚寅', '辛卯', '壬辰', '癸巳', '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑'],
            '丁': ['壬寅', '癸卯', '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑'],
            '戊': ['甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥', '甲子', '乙丑'],
            '己': ['丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉', '甲戌', '乙亥', '丙子', '丁丑'],
            '庚': ['戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未', '甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑'],
            '辛': ['庚寅', '辛卯', '壬辰', '癸巳', '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑'],
            '壬': ['壬寅', '癸卯', '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑'],
            '癸': ['甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥', '甲子', '乙丑']
          };
          
    
        // 获取年干
        const yearGan = this.data.bazi.year.charAt(0);
        // 根据年干获取对应的月干支序列
        const monthPillars = yearToMonthMapping[yearGan];
    
        // 根据阳历日期计算月柱索引，假设从2月4日开始，每隔30天切换月柱
        let pillarIndex = 0;
        let currentDate = new Date(year, month - 1, day);
        //console.log(currentDate)
        let startOfPillar = new Date(year, 1, 4); // 2月4日
        //console.log(startOfPillar)
        // 如果当前日期早于2月4日，则需要计算去年的月柱
        if (currentDate < startOfPillar) {
          currentDate = new Date(year , month - 1, day);  
          startOfPillar = new Date(year - 1, 1, 4);
        }
        //console.log(currentDate)
        //console.log(startOfPillar)
        const days = (currentDate - startOfPillar) / (1000 * 3600 * 24);
        
        pillarIndex = Math.floor(days / 30.4) % 12; // 30.4大约为一个月的天数
    
        // 设置月柱
        const monthPillar = monthPillars[pillarIndex];
        this.setData({
          'bazi.month': monthPillar // 更新到八字数据中的月柱
        });
    },
    calculateDailyStemBranch:function (year, month, day) {
        // Define the array for the 60 Gan-Zhi cycle
        const sexagenaryCycle = [
            '甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉',
            '甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未',
            '甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳',
            '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸卯',
            '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑',
            '甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥'
          ];
      
        // Calculate days since the fixed date (Feb 29, 2024 in the example)
        const fixedDate = new Date(year, 0, 0); // Note: Month is 0-indexed, so 1 is February
        const currentDate = new Date(year, month - 1, day); // Adjust month to be 0-indexed
        const daysDifference = Math.floor((currentDate - fixedDate) / (1000 * 60 * 60 * 24));
        console.log(daysDifference)
        // Calculate the index for the sexagenary cycle
        const cycleIndex = (((year - 1) * 5 + Math.floor((year - 1) / 4) + daysDifference) % 60) - 1; // Adjust by one for zero-index
        
        // Return the stem-branch combination for that day
        const dayPillar = sexagenaryCycle[cycleIndex];
        this.setData({
            'bazi.day': dayPillar // 更新到八字数据中的月柱
          });
    },
    calculateHourPillar: function(dayStem, birthTime) {
        const dayHourMapping  = {
            '甲': ['甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉', '甲戌', '乙亥'],
            '乙': ['丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未', '甲申', '乙酉', '丙戌', '丁亥'],
            '丙': ['戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳', '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥'],
            '丁': ['庚子', '辛丑', '壬寅', '癸卯', '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥'],
            '戊': ['壬子', '癸丑', '甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥'],
            '己': ['甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉', '甲戌', '乙亥'],
            '庚': ['丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未','甲申', '乙酉', '丙戌' , '丁亥'],
            '辛': ['戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳', '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥'],
            '壬': ['庚子', '辛丑', '壬寅', '癸卯', '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥'],
            '癸': ['壬子', '癸丑', '甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥']
          };
     
        // Determine the earthly branch based on the birth time
        const hour = parseInt(birthTime.split(':')[0], 10); // Extract the hour from the birth time
        
        let branchIndex;
        if (hour === 23 || hour === 0) {
             branchIndex = 0; // '子' period
        } else {
             branchIndex = Math.floor((hour + 1) / 2);
        }
      
        // Map the day stem to the hour stem using the provided day-hour mapping
        const hourStem = dayHourMapping[dayStem[0]][branchIndex];
      
        // Combine the hour stem with the earthly branch to form the hour pillar
        this.setData({
            'bazi.hour': hourStem // 更新到八字数据中的月柱
          });
    },
    calculateTenGods: function() {
        const tenGodsMapping = {
            '甲': {
              '甲': '比肩', '乙': '劫财', '丙': '食神', '丁': '伤官', '戊': '偏财', '己': '正财', '庚': '七杀', '辛': '正官', '壬': '偏印', '癸': '正印'
            },
            '乙': {
              '甲': '劫财', '乙': '比肩', '丙': '伤官', '丁': '食神', '戊': '正财', '己': '偏财', '庚': '正官', '辛': '七杀', '壬': '正印', '癸': '偏印'
            },
            '丙': {
              '甲': '偏印', '乙': '正印', '丙': '比肩', '丁': '劫财', '戊': '食神', '己': '伤官', '庚': '偏财', '辛': '正财', '壬': '七杀', '癸': '正官'
            },
            '丁': {
              '甲': '正印', '乙': '偏印', '丙': '劫财', '丁': '比肩', '戊': '伤官', '己': '食神', '庚': '正财', '辛': '偏财', '壬': '正官', '癸': '七杀'
            },
            '戊': {
              '甲': '七杀', '乙': '正官', '丙': '偏印', '丁': '正印', '戊': '比肩', '己': '劫财', '庚': '食神', '辛': '伤官', '壬': '偏财', '癸': '正财' },
            '己': {
              '甲': '正官', '乙': '七杀', '丙': '正印', '丁': '偏印', '戊': '劫财', '己': '比肩', '庚': '伤官', '辛': '食神', '壬': '正财', '癸': '偏财'
            },
            '庚': {
              '甲': '偏财', '乙': '正财', '丙': '七杀', '丁': '正官', '戊': '偏印', '己': '正印', '庚': '比肩', '辛': '劫财', '壬': '食神', '癸': '伤官'
            },
            '辛': {
              '甲': '正财', '乙': '偏财', '丙': '正官', '丁': '七杀', '戊': '正印', '己': '偏印', '庚': '劫财', '辛': '比肩', '壬': '伤官', '癸': '食神'
            },
            '壬': {
              '甲': '食神', '乙': '伤官', '丙': '偏财', '丁': '正财', '戊': '七杀', '己': '正官', '庚': '偏印', '辛': '正印', '壬': '比肩', '癸': '劫财'
            },
            '癸': {
              '甲': '伤官', '乙': '食神', '丙': '正财', '丁': '偏财', '戊': '正官', '己': '七杀', '庚': '正印', '辛': '偏印', '壬': '劫财', '癸': '比肩'
            }
          };
        const hiddenStems = {
            '子': ['癸'],
            '丑': ['己', '癸', '辛'],
            '寅': ['甲', '丙', '戊'],
            '卯': ['乙'],
            '辰': ['戊', '乙', '癸'],
            '巳': ['丙', '庚', '戊'],
            '午': ['丁', '己'],
            '未': ['己', '乙', '丁'],
            '申': ['庚', '壬', '戊'],
            '酉': ['辛'],
            '戌': ['戊', '辛', '丁'],
            '亥': ['壬', '甲']
          };
        function getTenGod(dayMasterStem, stem, gender) {
            // Use the mapping to get the general name of the Ten God
            let tenGod = tenGodsMapping[dayMasterStem][stem];

            // If the stem is the same as the Day Master, append gender-specific naming

            return tenGod;
         }
         function yuan(gender){
            let   tenGod = (gender === 'male' ? '元男' : '元女');
            return tenGod;
         }
        const dayMasterStem = this.data.bazi.day.charAt(0); // Assuming day pillar is stored like "壬寅"
        
        // Iterate over each pillar's branch to get hidden stems and their Ten Gods
        const tenGodsForBranches = {
            year: hiddenStems[this.data.bazi.year.charAt(1)].map(stem => getTenGod(dayMasterStem, stem)),
            month: hiddenStems[this.data.bazi.month.charAt(1)].map(stem => getTenGod(dayMasterStem, stem)),
            day: hiddenStems[this.data.bazi.day.charAt(1)].map(stem => getTenGod(dayMasterStem, stem)),
            hour: hiddenStems[this.data.bazi.hour.charAt(1)].map(stem => getTenGod(dayMasterStem, stem)),
        };
    
        // Get the Ten Gods for each pillar's stem
        const tenGodsForStems = {
            year: getTenGod(dayMasterStem, this.data.bazi.year.charAt(0)),
            month: getTenGod(dayMasterStem, this.data.bazi.month.charAt(0)),
            day: yuan(this.data.gender), // This should always be '比肩' or '劫财'
            hour: getTenGod(dayMasterStem, this.data.bazi.hour.charAt(0)),
        };
    
        // Combine the Ten Gods for stems and branches into the data object
        const tenGods = {
            stems: tenGodsForStems,
            branches: tenGodsForBranches
        };
    
        // Store the Ten Gods in the data object
        this.setData({ tenGods });
    }
});
  





  


  
  




  
 

  

