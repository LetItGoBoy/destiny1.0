Page({
    data: {
        bazi: {
            year: '',
            month: '',
            day: '',
            hour: ''
        },
        energies: {}, // To store the initialized energies for each character
        // Other data properties...
        stemElements : {
            '甲': '木', '乙': '木', '丙': '火', '丁': '火',
            '戊': '土', '己': '土', '庚': '金', '辛': '金',
            '壬': '水', '癸': '水'
        },
        branchElements : {
            '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土',
            '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金',
            '戌': '土', '亥': '水'
        },
        hiddenStems : {
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
        },
        generating : {
            '金': '水', '水': '木', '木': '火', '火': '土', '土': '金'
        },
        overcoming : {
            '金': '木', '木': '土', '土': '水', '水': '火', '火': '金'
        },
    },
    
    onLoad: function(options) {
        // Assume the BaZi data is passed in the options, like options.year
        this.setData({
            'bazi.year': options.year,
            'bazi.month': options.month,
            'bazi.day': options.day,
            'bazi.hour': options.hour
        });
        const stemElements = this.data.stemElements;
        const branchElements= this.data.branchElements;
        const hiddenStems=this.data.hiddenStems;
        // Initialize energies for each character in the BaZi
        this.initializeEnergies(stemElements,branchElements,hiddenStems);
        console.log(this.data.energies)
        // Apply vertical interactions within each pillar
        this.applyVerticalInteractions();
        console.log(this.data.energies)
        // Apply horizontal interactions across pillars
        this.applyHorizontalInteractions();
    },

    initializeEnergies: function(stemElements,branchElements,hiddenStems) {
        let energies = {};
        let bazi = this.data.bazi;
       
    
        ['year', 'month', 'day', 'hour'].forEach((pillar) => {
            let stem = bazi[pillar].charAt(0);
            let branch = bazi[pillar].charAt(1);
           
            energies[pillar] = {
                stem: {
                    element: stemElements[stem],
                    energy: 10
                },
                branch: {
                    element: branchElements[branch],
                    energy: 10,
                    hiddenStems: []
                }
            };
    
            if (hiddenStems[branch]) {
                let totalHidden = hiddenStems[branch].length;
                let energiesPerHidden;
                switch (totalHidden) {
                    case 1:
                        energiesPerHidden = [10]; // Only one, it takes all the energy
                        break;
                    case 2:
                        energiesPerHidden = [7, 3]; // Two hidden stems, split 7 and 3
                        break;
                    case 3:
                        energiesPerHidden = [6, 3, 1]; // Three hidden stems, split 6, 3, and 1
                        break;
                    default:
                        energiesPerHidden = hiddenStems[branch].map(() => 10 / totalHidden); // Divide evenly if unexpected case
                        break;
                }
    
                hiddenStems[branch].forEach((hiddenStem, index) => {
                    energies[pillar].branch.hiddenStems.push({
                        stem: hiddenStem,
                        element: stemElements[hiddenStem],
                        energy: energiesPerHidden[index]
                    });
                });
            }
        });
    
        this.setData({
            energies: energies
        });
    },
      
      
    applyVerticalInteractions: function() {
   
        // Assuming `energies` is an object with keys 'year', 'month', 'day', 'hour'
        let pillars = this.data.energies;
    
        Object.keys(pillars).forEach(pillarKey => {
            let pillar = pillars[pillarKey];
            let stem = pillar.stem;
            let branch = pillar.branch;
            console.log(stem)
            // Apply '比劫助' rule
            if (this.isBiJie(stem.element, branch.element)) {
                stem.energy *= (1 + 0.5);
                branch.energy *= (1 + 0.5);
                
            } else if (this.isYinXiaoShengWo(stem.element, branch.element)) {
                let oldstem = stem.energy ;
                let oldbranch = stem.energy ;
                stem.energy =  oldstem -  oldstem*0.3;
                branch.energy = oldbranch +  oldstem*0.3;
                
            } else if (this.isWoShengShishang(stem.element, branch.element)) {
                let oldstem = stem.energy ;
                let oldbranch = stem.energy ;
                branch.energy = oldbranch -  oldbranch*0.3;
                stem.energy =  oldstem + oldbranch*0.3;
            } else if (this.isWoKeGuanSha(stem.element, branch.element)) {
                let oldstem = stem.energy ;
                let oldbranch = stem.energy ;
                branch.energy  = oldbranch - oldbranch*0.3;
                stem.energy =  oldstem - oldbranch*0.7;
            } else if (this.isGuanShaKeWo(stem.element, branch.element)) {
                let oldstem = stem.energy ;
                let oldbranch = stem.energy ;
                branch.energy  = oldbranch - oldstem*0.7;
                stem.energy =  oldstem - oldstem*0.3;
            }
        });
    
        // Save the updated energies back to data
        this.setData({
            energies: pillars
        });
    },
      
      // Define utility functions to check for specific relationships
      isYinXiaoShengWo: function(stem, branch) {
  
        return this.data.generating[stem] === branch;
      },
      
      // Utility function to determine if the branch generates the stem (我生偏财)
      isWoShengShishang: function(stem, branch) {
 
        return this.data.generating[branch] === stem;
      },
      
      // Utility function to determine if the branch overcomes the stem (我克官杀)
      isWoKeGuanSha: function(stem, branch) {
   
        return this.data.overcoming[branch] === stem;
      },
      
      // Utility function to determine if the stem overcomes the branch (官杀克我)
      isGuanShaKeWo: function(stem, branch) {
        return this.data.overcoming[stem] === branch;
      },
      
      // Utility function to determine if the relationship between stem and branch is '比劫助' (BiJie)
      isBiJie: function(stem, branch) {
        return stem === branch;
      },
      
    applyHorizontalInteractions: function() {
        // Apply the horizontal interactions across the pillars
        // Consider the relationships such as clash, harm, punishment, and combination
        // Pseudocode:
        // if (pillar1 clashes with pillar2) { adjust energies }
        // if (pillar1 combines with pillar2) { adjust energies }
        // ... (and so on for harm and punishment)
    },

    // Define additional methods for interaction logic here...
    // For example:
    // isClash: function(pillar1, pillar2) { /* ... */ },
    // isCombination: function(pillar1, pillar2) { /* ... */ },
    // ... (and so on)
});
