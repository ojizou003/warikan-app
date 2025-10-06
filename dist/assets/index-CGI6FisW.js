(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))a(r);new MutationObserver(r=>{for(const i of r)if(i.type==="childList")for(const n of i.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&a(n)}).observe(document,{childList:!0,subtree:!0});function t(r){const i={};return r.integrity&&(i.integrity=r.integrity),r.referrerPolicy&&(i.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?i.credentials="include":r.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(r){if(r.ep)return;r.ep=!0;const i=t(r);fetch(r.href,i)}})();const s={EQUAL:"equal",ORGANIZER_MORE:"organizer_more",ORGANIZER_LESS:"organizer_less",ORGANIZER_FIXED:"organizer_fixed"};class f{constructor(){this.types=s}calculate(e){if(!this.validateInput(e))throw new Error("Invalid input for calculation");switch(e.type){case s.EQUAL:return this.calculateEqual(e.totalAmount,e.numberOfPeople);case s.ORGANIZER_MORE:return this.calculateOrganizerMore(e.totalAmount,e.numberOfPeople,e.organizerBurden);case s.ORGANIZER_LESS:return this.calculateOrganizerLess(e.totalAmount,e.numberOfPeople,e.organizerBurden);case s.ORGANIZER_FIXED:return this.calculateOrganizerFixed(e.totalAmount,e.numberOfPeople,e.organizerFixed);default:throw new Error(`Unknown calculation type: ${e.type}`)}}calculateEqual(e,t){const a=Math.floor(e/t),r=e%t;return{type:s.EQUAL,totalAmount:e,numberOfPeople:t,perPerson:a,remainder:r,organizerPayment:a,participantPayment:a,timestamp:Date.now()}}calculateOrganizerMore(e,t,a){const r=1+a/100,i=(t-r)/(t-1);let n=Math.floor(e*(r/t)),o;if(i>0)o=Math.floor(e*(i/t));else return this.calculateEqual(e,t);const l=n+o*(t-1);let d=e-l;return d>0?(n+=d,d=0):d<0&&(o+=Math.abs(d),d=0),{type:s.ORGANIZER_MORE,totalAmount:e,numberOfPeople:t,perPerson:o,remainder:d,organizerPayment:n,participantPayment:o,organizerBurdenPercent:a,timestamp:Date.now()}}calculateOrganizerLess(e,t,a){const r=1-a/100,i=(t-r)/(t-1);let n=Math.floor(e*(r/t)),o;if(r>0&&i>0)o=Math.floor(e*(i/t));else return this.calculateEqual(e,t);const l=n+o*(t-1);let d=e-l;if(d>0){const h=Math.floor(d/(t-1));o+=h,d=d-h*(t-1)}else d<0&&(n+=Math.abs(d),d=0);return{type:s.ORGANIZER_LESS,totalAmount:e,numberOfPeople:t,perPerson:o,remainder:d,organizerPayment:n,participantPayment:o,organizerReductionPercent:a,timestamp:Date.now()}}calculateOrganizerFixed(e,t,a){if(a>=e)return this.calculateEqual(e,t);if(a<0)return this.calculateEqual(e,t);const r=e-a,i=t-1;if(i<=0)return this.calculateEqual(e,t);const n=Math.floor(r/i),o=r%i;return{type:s.ORGANIZER_FIXED,totalAmount:e,numberOfPeople:t,perPerson:n,remainder:o,organizerPayment:a,participantPayment:n,organizerFixedAmount:a,timestamp:Date.now()}}validateInput(e){if(!e||typeof e!="object"||typeof e.totalAmount!="number"||typeof e.numberOfPeople!="number"||typeof e.type!="string"||e.totalAmount<1||e.totalAmount>1e10||e.numberOfPeople<1||e.numberOfPeople>9999)return!1;switch(e.type){case s.ORGANIZER_MORE:if(typeof e.organizerBurden!="number"||e.organizerBurden<1||e.organizerBurden>100)return!1;break;case s.ORGANIZER_LESS:if(typeof e.organizerBurden!="number"||e.organizerBurden<1||e.organizerBurden>99)return!1;break;case s.ORGANIZER_FIXED:if(typeof e.organizerFixed!="number"||e.organizerFixed<0)return!1;break}return!0}getAvailableTypes(){return[{type:s.EQUAL,label:"均等割り",description:"全員で均等に割り勘します"},{type:s.ORGANIZER_MORE,label:"幹事多め",description:"幹事が指定した割合だけ多く負担します"},{type:s.ORGANIZER_LESS,label:"幹事少なめ",description:"幹事が指定した割合だけ少なく負担します"},{type:s.ORGANIZER_FIXED,label:"幹事固定",description:"幹事が固定額を負担し、残りを均等に割ります"}]}getSummary(e){switch(e.type){case s.EQUAL:return`一人 ${e.perPerson.toLocaleString()}円`;case s.ORGANIZER_MORE:return`幹事: ${e.organizerPayment.toLocaleString()}円、参加者: 一人 ${e.participantPayment.toLocaleString()}円`;case s.ORGANIZER_LESS:return`幹事: ${e.organizerPayment.toLocaleString()}円、参加者: 一人 ${e.participantPayment.toLocaleString()}円`;case s.ORGANIZER_FIXED:return`幹事: ${e.organizerPayment.toLocaleString()}円、参加者: 一人 ${e.participantPayment.toLocaleString()}円`;default:return`一人 ${e.perPerson.toLocaleString()}円`}}getRemainderHandling(e){switch(e){case s.EQUAL:return"余りは表示され、調整は行いません";case s.ORGANIZER_MORE:return"余りは幹事が負担します";case s.ORGANIZER_LESS:return"余りは参加者間で分配されます";case s.ORGANIZER_FIXED:return"参加者間の割り勘で生じた余りは表示されます";default:return"特別な端数処理はありません"}}}class S{constructor(){this.storageKey="warikan_history",this.maxEntries=50,this.version="1.0.0",this.maxStorageSize=5*1024*1024,this.initialize()}initialize(){if(this.getStorageData())this.migrate();else{const e={version:this.version,entries:[],settings:{maxEntries:this.maxEntries,autoCleanup:!0},metadata:{createdAt:Date.now(),lastModified:Date.now()}};this.setStorageData(e)}}saveCalculation(e,t=""){const a=this.getStorageData();a.entries||(a.entries=[]);const r={id:this.generateId(),calculationResult:{...e,type:e.type||"equal",timestamp:e.timestamp||Date.now()},note:t,tags:this.extractTags(e),createdAt:Date.now()};return a.entries.unshift(r),a.entries.length>this.maxEntries&&(a.entries=a.entries.slice(0,this.maxEntries)),a.metadata.lastModified=Date.now(),this.setStorageData(a),this.checkStorageCapacity(),r.id}getHistory(e={}){const t=this.getStorageData();if(!t||!t.entries)return[];let a=[...t.entries];e.type&&(a=a.filter(n=>n.calculationResult.type===e.type)),e.dateFrom&&(a=a.filter(n=>{const o=new Date(n.createdAt),l=new Date(e.dateFrom);return o>=l})),e.dateTo&&(a=a.filter(n=>{const o=new Date(n.createdAt),l=new Date(e.dateTo);return o<=l}));const r=e.limit||20,i=e.offset||0;return a.slice(i,i+r)}getHistoryItem(e){const t=this.getStorageData();return!t||!t.entries?null:t.entries.find(a=>a.id===e)||null}deleteHistoryItem(e){const t=this.getStorageData();if(!t||!t.entries)return!1;const a=t.entries.length;return t.entries=t.entries.filter(r=>r.id!==e),t.entries.length<a?(t.metadata.lastModified=Date.now(),this.setStorageData(t),!0):!1}clearHistory(){const e=this.getStorageData();e&&(e.entries=[],e.metadata.lastModified=Date.now(),this.setStorageData(e))}exportHistory(){const t={...this.getStorageData(),exportedAt:Date.now(),version:this.version};return JSON.stringify(t,null,2)}importHistory(e,t={}){try{const a=JSON.parse(e);if(!a.entries||!Array.isArray(a.entries))throw new Error("Invalid data format");const r=this.getStorageData();if(t.merge!==!1&&r&&r.entries){const n=new Set(r.entries.map(l=>l.id)),o=a.entries.filter(l=>!n.has(l.id));r.entries=[...o,...r.entries],r.entries.length>this.maxEntries&&(r.entries=r.entries.slice(0,this.maxEntries))}else r.entries=a.entries;return r.metadata.lastModified=Date.now(),r.metadata.importedAt=Date.now(),this.setStorageData(r),!0}catch(a){return console.error("Import failed:",a),!1}}getStorageData(){try{const e=localStorage.getItem(this.storageKey);return e?JSON.parse(e):null}catch(e){return console.error("Failed to get storage data:",e),{version:this.version,entries:[],settings:{maxEntries:this.maxEntries,autoCleanup:!0},metadata:{createdAt:Date.now(),lastModified:Date.now()}}}}setStorageData(e){try{return localStorage.setItem(this.storageKey,JSON.stringify(e)),!0}catch(t){if(console.error("Failed to set storage data:",t),t.name==="QuotaExceededError"){this.cleanupOldData();try{return localStorage.setItem(this.storageKey,JSON.stringify(e)),!0}catch(a){console.error("Retry failed:",a)}}return!1}}generateId(){return`history_${Date.now()}_${Math.random().toString(36).substr(2,9)}`}extractTags(e){const t=[];return e.total>=1e4?t.push("high_amount"):e.total<=1e3&&t.push("low_amount"),e.count>=10?t.push("large_group"):e.count<=3&&t.push("small_group"),e.remainder>0&&t.push("has_remainder"),t}migrate(){const e=this.getStorageData();if(e&&e.version!==this.version){if(!e.entries&&Array.isArray(e)){const t={version:this.version,entries:e.map((a,r)=>({id:`migrated_${r}`,calculationResult:{...a,type:"equal",timestamp:a.timestamp||Date.now()},note:"",tags:[],createdAt:a.timestamp||Date.now()})),settings:{maxEntries:this.maxEntries,autoCleanup:!0},metadata:{createdAt:Date.now(),lastModified:Date.now(),migrated:!0}};this.setStorageData(t)}e.version=this.version,this.setStorageData(e)}}checkStorageCapacity(){try{const e=localStorage.getItem(this.storageKey),a=new Blob([e]).size/this.maxStorageSize*100;a>80&&(console.warn(`Storage usage is high: ${a.toFixed(2)}%`),this.cleanupOldData())}catch(e){console.error("Failed to check storage capacity:",e)}}cleanupOldData(){const e=this.getStorageData();if(!e||!e.entries)return;const t=Math.floor(this.maxEntries/2);e.entries.length>t&&(e.entries=e.entries.slice(0,t),e.metadata.lastModified=Date.now(),e.metadata.cleanup=!0,this.setStorageData(e),console.log("Cleaned up old history entries"))}getStatistics(){var n,o;const e=this.getStorageData();if(!e||!e.entries||e.entries.length===0)return{totalEntries:0,totalAmount:0,averageAmount:0,mostCommonType:"equal",typeBreakdown:{},oldestEntry:null,newestEntry:null};const t=e.entries,a=t.reduce((l,d)=>l+(d.calculationResult.total||0),0),r={};t.forEach(l=>{const d=l.calculationResult.type||"equal";r[d]=(r[d]||0)+1});const i=Object.keys(r).length>0?Object.keys(r).reduce((l,d)=>r[l]>r[d]?l:d):"equal";return{totalEntries:t.length,totalAmount:a,averageAmount:t.length>0?Math.round(a/t.length):0,mostCommonType:i,typeBreakdown:r,oldestEntry:((n=t[t.length-1])==null?void 0:n.createdAt)||null,newestEntry:((o=t[0])==null?void 0:o.createdAt)||null}}}const p=new S;class z{constructor(e,t={}){this.container=e,this.options={onCalculate:null,defaultValues:{totalAmount:3e3,numberOfPeople:3,organizerBurden:20,organizerFixed:1e3},...t},this.calculationEngine=new f,this.currentType=s.EQUAL,this.patternContainer=null,this.inputContainer=null,this.resultContainer=null,this.historyButtonContainer=null,this.init()}init(){this.createUI(),this.bindEvents(),this.setupValidation(),this.setDefaultValues()}createUI(){this.container.innerHTML=`
            <div class="organizer-ui" data-component="organizer-ui">
                <!-- パターン選択 -->
                <div class="pattern-selection" data-element="pattern-selection">
                    <h2 style="margin: 0 0 16px 0; font-size: 1.3rem; color: #333;">割り勘パターンを選択</h2>
                    <div class="pattern-buttons" data-element="pattern-buttons" style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 12px;
                        margin-bottom: 24px;
                    ">
                        <button class="pattern-button active" data-pattern="equal" style="
                            padding: 16px;
                            border: 2px solid #667eea;
                            border-radius: 8px;
                            background: #667eea;
                            color: white;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            font-size: 1rem;
                            font-weight: 500;
                        ">
                            <div style="font-size: 1.5rem; margin-bottom: 4px;">👥</div>
                            <div>均等割り</div>
                            <div style="font-size: 0.8rem; opacity: 0.9; margin-top: 4px;">全員で均等に</div>
                        </button>

                        <button class="pattern-button" data-pattern="organizer_more" style="
                            padding: 16px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            background: white;
                            color: #333;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            font-size: 1rem;
                            font-weight: 500;
                        ">
                            <div style="font-size: 1.5rem; margin-bottom: 4px;">💰</div>
                            <div>幹事多め</div>
                            <div style="font-size: 0.8rem; opacity: 0.7; margin-top: 4px;">幹事が多く負担</div>
                        </button>

                        <button class="pattern-button" data-pattern="organizer_less" style="
                            padding: 16px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            background: white;
                            color: #333;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            font-size: 1rem;
                            font-weight: 500;
                        ">
                            <div style="font-size: 1.5rem; margin-bottom: 4px;">🎁</div>
                            <div>幹事少なめ</div>
                            <div style="font-size: 0.8rem; opacity: 0.7; margin-top: 4px;">幹事が少なく負担</div>
                        </button>

                        <button class="pattern-button" data-pattern="organizer_fixed" style="
                            padding: 16px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            background: white;
                            color: #333;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            font-size: 1rem;
                            font-weight: 500;
                        ">
                            <div style="font-size: 1.5rem; margin-bottom: 4px;">💵</div>
                            <div>幹事固定</div>
                            <div style="font-size: 0.8rem; opacity: 0.7; margin-top: 4px;">幹事の額を固定</div>
                        </button>
                    </div>
                </div>

                <!-- 基本入力 -->
                <div class="basic-inputs" data-element="basic-inputs" style="
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                ">
                    <div class="input-group" style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 16px;
                    ">
                        <div class="input-wrapper">
                            <label for="total-amount" style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 500;
                                color: #333;
                            ">総額（円）</label>
                            <div class="price-wrapper" style="position: relative;">
                                <input type="number" id="total-amount" data-input="total-amount" style="
                                    width: 100%;
                                    padding: 12px 40px 12px 12px;
                                    border: 2px solid #ddd;
                                    border-radius: 6px;
                                    font-size: 1.1rem;
                                    transition: border-color 0.2s ease;
                                " placeholder="0" min="1" max="10000000000">
                                <span style="
                                    position: absolute;
                                    right: 12px;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    color: #666;
                                    font-weight: 500;
                                ">円</span>
                            </div>
                            <div class="input-error" data-error="total-amount" style="
                                color: #e74c3c;
                                font-size: 0.9rem;
                                margin-top: 4px;
                                display: none;
                            "></div>
                        </div>

                        <div class="input-wrapper">
                            <label for="number-of-people" style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 500;
                                color: #333;
                            ">人数</label>
                            <div class="count-wrapper" style="position: relative;">
                                <input type="number" id="number-of-people" data-input="number-of-people" style="
                                    width: 100%;
                                    padding: 12px 40px 12px 12px;
                                    border: 2px solid #ddd;
                                    border-radius: 6px;
                                    font-size: 1.1rem;
                                    transition: border-color 0.2s ease;
                                " placeholder="0" min="1" max="9999">
                                <span style="
                                    position: absolute;
                                    right: 12px;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    color: #666;
                                    font-weight: 500;
                                ">人</span>
                            </div>
                            <div class="input-error" data-error="number-of-people" style="
                                color: #e74c3c;
                                font-size: 0.9rem;
                                margin-top: 4px;
                                display: none;
                            "></div>
                        </div>
                    </div>
                </div>

                <!-- 幹事負担入力 -->
                <div class="organizer-inputs" data-element="organizer-inputs" style="
                    background: #f0f4ff;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    display: none;
                ">
                    <h3 style="margin: 0 0 16px 0; font-size: 1.2rem; color: #333;">
                        幹事の負担設定
                    </h3>

                    <!-- 幹事多め負担 -->
                    <div class="organizer-more-input" data-input-type="organizer_more" style="display: none;">
                        <label for="organizer-burden-more" style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 500;
                            color: #333;
                        ">幹事の追加負担（%）</label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="range" id="organizer-burden-slider-more" data-input="organizer-burden-slider" style="
                                flex: 1;
                                -webkit-appearance: none;
                                height: 8px;
                                border-radius: 4px;
                                background: #ddd;
                                outline: none;
                            " min="1" max="100" value="20">
                            <input type="number" id="organizer-burden-more" data-input="organizer-burden" style="
                                width: 80px;
                                padding: 8px;
                                border: 2px solid #ddd;
                                border-radius: 6px;
                                text-align: center;
                                font-size: 1rem;
                            " min="1" max="100" value="20">
                            <span>%</span>
                        </div>
                        <div class="burden-preview" data-preview="organizer-more" style="
                            margin-top: 12px;
                            padding: 12px;
                            background: white;
                            border-radius: 6px;
                            font-size: 0.9rem;
                            color: #666;
                        "></div>
                    </div>

                    <!-- 幹事少なめ負担 -->
                    <div class="organizer-less-input" data-input-type="organizer_less" style="display: none;">
                        <label for="organizer-burden-less" style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 500;
                            color: #333;
                        ">幹事の軽減率（%）</label>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="range" id="organizer-burden-slider-less" data-input="organizer-burden-slider" style="
                                flex: 1;
                                -webkit-appearance: none;
                                height: 8px;
                                border-radius: 4px;
                                background: #ddd;
                                outline: none;
                            " min="1" max="99" value="20">
                            <input type="number" id="organizer-burden-less" data-input="organizer-burden" style="
                                width: 80px;
                                padding: 8px;
                                border: 2px solid #ddd;
                                border-radius: 6px;
                                text-align: center;
                                font-size: 1rem;
                            " min="1" max="99" value="20">
                            <span>%</span>
                        </div>
                        <div class="burden-preview" data-preview="organizer-less" style="
                            margin-top: 12px;
                            padding: 12px;
                            background: white;
                            border-radius: 6px;
                            font-size: 0.9rem;
                            color: #666;
                        "></div>
                    </div>

                    <!-- 幹事固定額 -->
                    <div class="organizer-fixed-input" data-input-type="organizer_fixed" style="display: none;">
                        <label for="organizer-fixed" style="
                            display: block;
                            margin-bottom: 8px;
                            font-weight: 500;
                            color: #333;
                        ">幹事の固定額</label>
                        <div class="price-wrapper" style="position: relative;">
                            <input type="number" id="organizer-fixed" data-input="organizer-fixed" style="
                                width: 100%;
                                max-width: 300px;
                                padding: 12px 40px 12px 12px;
                                border: 2px solid #ddd;
                                border-radius: 6px;
                                font-size: 1.1rem;
                                transition: border-color 0.2s ease;
                            " placeholder="0" min="0">
                            <span style="
                                position: absolute;
                                right: 12px;
                                top: 50%;
                                transform: translateY(-50%);
                                color: #666;
                                font-weight: 500;
                            ">円</span>
                        </div>
                        <div class="burden-preview" data-preview="organizer-fixed" style="
                            margin-top: 12px;
                            padding: 12px;
                            background: white;
                            border-radius: 6px;
                            font-size: 0.9rem;
                            color: #666;
                        "></div>
                    </div>
                </div>

                <!-- 計算ボタン -->
                <div class="calculate-section" style="text-align: center; margin-bottom: 24px;">
                    <button class="calculate-button" data-element="calculate-button" style="
                        padding: 16px 48px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 1.2rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                    ">
                        計算する
                    </button>
                </div>

                <!-- 結果表示 -->
                <div class="result-section" data-element="result-section" style="
                    background: white;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 24px;
                    display: none;
                ">
                    <h3 style="margin: 0 0 20px 0; font-size: 1.3rem; color: #333;">計算結果</h3>
                    <div class="result-details" data-element="result-details">
                        <!-- 結果がここに表示される -->
                    </div>
                </div>

                <!-- アクションボタン -->
                <div class="action-buttons" data-element="action-buttons" style="
                    display: none;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 12px;
                    margin-top: 20px;
                ">
                    <button class="action-button share-button" data-action="share" style="
                        padding: 12px;
                        border: 2px solid #667eea;
                        border-radius: 8px;
                        background: white;
                        color: #667eea;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        font-weight: 500;
                    ">
                        <span style="margin-right: 8px;">📤</span>
                        シェア
                    </button>

                    <button class="action-button save-button" data-action="save" style="
                        padding: 12px;
                        border: 2px solid #27ae60;
                        border-radius: 8px;
                        background: white;
                        color: #27ae60;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        font-weight: 500;
                    ">
                        <span style="margin-right: 8px;">💾</span>
                        履歴に保存
                    </button>

                    <button class="action-button history-button" data-action="history" style="
                        padding: 12px;
                        border: 2px solid #e67e22;
                        border-radius: 8px;
                        background: white;
                        color: #e67e22;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        font-weight: 500;
                    ">
                        <span style="margin-right: 8px;">📋</span>
                        履歴を見る
                    </button>

                    <button class="action-button clear-button" data-action="clear" style="
                        padding: 12px;
                        border: 2px solid #95a5a6;
                        border-radius: 8px;
                        background: white;
                        color: #95a5a6;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        font-weight: 500;
                    ">
                        <span style="margin-right: 8px;">🔄</span>
                        クリア
                    </button>
                </div>
            </div>
        `,this.addStyles(),this.patternContainer=this.container.querySelector('[data-element="pattern-selection"]'),this.inputContainer=this.container.querySelector('[data-element="basic-inputs"]'),this.resultContainer=this.container.querySelector('[data-element="result-section"]'),this.historyButtonContainer=this.container.querySelector('[data-element="action-buttons"]')}addStyles(){const e="organizer-ui-styles";if(!document.getElementById(e)){const t=document.createElement("style");t.id=e,t.textContent=`
                .pattern-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .pattern-button.active {
                    border-color: #667eea;
                    background: #667eea;
                    color: white;
                }

                input[type="number"]:focus,
                input[type="range"]:focus {
                    outline: none;
                    border-color: #667eea;
                }

                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    background: #667eea;
                    border-radius: 50%;
                    cursor: pointer;
                }

                input[type="range"]::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    background: #667eea;
                    border-radius: 50%;
                    cursor: pointer;
                    border: none;
                }

                .calculate-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
                }

                .calculate-button:active {
                    transform: translateY(0);
                }

                .action-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .result-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 20px;
                }

                .result-item {
                    text-align: center;
                    padding: 16px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                .result-item .label {
                    font-size: 0.9rem;
                    color: #666;
                    margin-bottom: 8px;
                }

                .result-item .value {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #333;
                }

                .result-item.organizer .value {
                    color: #667eea;
                }

                .result-item.participant .value {
                    color: #27ae60;
                }

                .result-item.remainder .value {
                    color: #e67e22;
                }

                .breakdown-section {
                    background: #f8f9fa;
                    padding: 16px;
                    border-radius: 8px;
                    margin-top: 16px;
                }

                .breakdown-section h4 {
                    margin: 0 0 12px 0;
                    color: #333;
                }

                .breakdown-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid #e0e0e0;
                }

                .breakdown-item:last-child {
                    border-bottom: none;
                    font-weight: 600;
                    color: #333;
                }

                @media (max-width: 768px) {
                    .pattern-buttons {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .result-summary {
                        grid-template-columns: 1fr;
                    }

                    .action-buttons {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            `,document.head.appendChild(t)}}bindEvents(){this.container.querySelectorAll("[data-pattern]").forEach(i=>{i.addEventListener("click",n=>{const o=n.currentTarget.dataset.pattern;this.selectPattern(o)})}),this.container.querySelectorAll("input[data-input]").forEach(i=>{i.addEventListener("input",()=>{this.handleInputChange(i)}),i.addEventListener("change",()=>{this.validateInput(i)})}),this.container.querySelector('[data-element="calculate-button"]').addEventListener("click",()=>{this.calculate()}),this.container.addEventListener("keydown",i=>{i.key==="Enter"&&i.target.tagName==="INPUT"&&(i.preventDefault(),this.calculate())}),this.container.querySelectorAll("[data-action]").forEach(i=>{i.addEventListener("click",n=>{const o=n.currentTarget.dataset.action;this.handleAction(o)})})}selectPattern(e){this.currentType=e,this.container.querySelectorAll("[data-pattern]").forEach(a=>{a.dataset.pattern===e?(a.classList.add("active"),a.style.borderColor="#667eea",a.style.background="#667eea",a.style.color="white"):(a.classList.remove("active"),a.style.borderColor="#e0e0e0",a.style.background="white",a.style.color="#333")}),this.toggleOrganizerInputs(e),this.updatePreview()}toggleOrganizerInputs(e){const t=this.container.querySelector('[data-element="organizer-inputs"]'),a=t.querySelectorAll("[data-input-type]");e===s.EQUAL?t.style.display="none":(t.style.display="block",a.forEach(r=>{r.dataset.inputType===e?r.style.display="block":r.style.display="none"}))}handleInputChange(e){if(e.dataset.input==="organizer-burden-slider"){const t=this.container.querySelector('[data-input="organizer-burden"]');t.value=e.value}else if(e.dataset.input==="organizer-burden"){const t=this.container.querySelector('[data-input="organizer-burden-slider"]');t.value=e.value}this.updatePreview()}updatePreview(){if(this.currentType===s.EQUAL)return;const e=this.getInputValue("total-amount"),t=this.getInputValue("number-of-people");if(!e||!t)return;let a="";switch(this.currentType){case s.ORGANIZER_MORE:const n=1+(this.getInputValue("organizer-burden")||20)/100,o=(t-n)/(t-1),l=Math.floor(e*(n/t)),d=Math.floor(e*(o/t));a=`幹事: ${l.toLocaleString()}円、参加者: ${d.toLocaleString()}円（概算）`;break;case s.ORGANIZER_LESS:const m=1-(this.getInputValue("organizer-burden")||20)/100,b=(t-m)/(t-1),x=Math.floor(e*(m/t)),v=Math.floor(e*(b/t));a=`幹事: ${x.toLocaleString()}円、参加者: ${v.toLocaleString()}円（概算）`;break;case s.ORGANIZER_FIXED:const g=this.getInputValue("organizer-fixed")||1e3,w=e-g,y=t-1,E=y>0?Math.floor(w/y):0;a=`幹事: ${g.toLocaleString()}円、参加者: ${E.toLocaleString()}円（概算）`;break}const r=this.container.querySelector(`[data-preview="${this.currentType}"]`);r&&(r.textContent=a)}getInputValue(e){const t=this.container.querySelector(`[data-input="${e}"]`);if(!t)return null;const a=parseInt(t.value,10);return isNaN(a)?null:a}calculate(){const e=this.getInputValue("total-amount"),t=this.getInputValue("number-of-people");if(!this.validateAllInputs())return;const a={totalAmount:e,numberOfPeople:t,type:this.currentType};switch(this.currentType){case s.ORGANIZER_MORE:a.organizerBurden=this.getInputValue("organizer-burden");break;case s.ORGANIZER_LESS:a.organizerBurden=this.getInputValue("organizer-burden");break;case s.ORGANIZER_FIXED:a.organizerFixed=this.getInputValue("organizer-fixed");break}try{const r=this.calculationEngine.calculate(a);this.displayResult(r),this.options.onCalculate&&this.options.onCalculate(r);const i=new CustomEvent("organizerUI:save",{detail:{result:r,note:""}});this.container.dispatchEvent(i)}catch(r){console.error("計算エラー:",r),this.showError("計算中にエラーが発生しました")}}displayResult(e){const t=this.container.querySelector('[data-element="result-details"]'),a=this.container.querySelector('[data-element="action-buttons"]');let r='<div class="result-summary">';e.type===s.EQUAL?r+=`
                <div class="result-item">
                    <div class="label">一人当たり</div>
                    <div class="value">${e.perPerson.toLocaleString()}円</div>
                </div>
                ${e.remainder>0?`
                    <div class="result-item remainder">
                        <div class="label">余り</div>
                        <div class="value">${e.remainder}円</div>
                    </div>
                `:""}
            `:r+=`
                <div class="result-item organizer">
                    <div class="label">幹事</div>
                    <div class="value">${e.organizerPayment.toLocaleString()}円</div>
                </div>
                <div class="result-item participant">
                    <div class="label">参加者一人</div>
                    <div class="value">${e.participantPayment.toLocaleString()}円</div>
                </div>
                ${e.remainder>0?`
                    <div class="result-item remainder">
                        <div class="label">余り</div>
                        <div class="value">${e.remainder}円</div>
                    </div>
                `:""}
            `,r+="</div>",r+='<div class="breakdown-section">',r+="<h4>内訳</h4>",r+='<div class="breakdown-item">',r+=`<span>総額</span><span>${e.totalAmount.toLocaleString()}円</span>`,r+="</div>",r+='<div class="breakdown-item">',r+=`<span>人数</span><span>${e.numberOfPeople}人</span>`,r+="</div>",e.type!==s.EQUAL&&(r+='<div class="breakdown-item">',r+=`<span>幹事支払額</span><span>${e.organizerPayment.toLocaleString()}円</span>`,r+="</div>",r+='<div class="breakdown-item">',r+=`<span>参加者計</span><span>${(e.participantPayment*(e.numberOfPeople-1)).toLocaleString()}円</span>`,r+="</div>"),r+='<div class="breakdown-item">',r+=`<span>合計</span><span>${(e.type===s.EQUAL?e.perPerson*e.numberOfPeople+e.remainder:e.organizerPayment+e.participantPayment*(e.numberOfPeople-1)).toLocaleString()}円</span>`,r+="</div>",r+="</div>",t.innerHTML=r,this.resultContainer.style.display="block",a.style.display="grid",this.resultContainer.scrollIntoView({behavior:"smooth",block:"nearest"})}handleAction(e){const t=new CustomEvent("organizerUI:action",{detail:{action:e,currentType:this.currentType}});this.container.dispatchEvent(t)}setupValidation(){const e={"total-amount":{min:1,max:1e10,required:!0,message:"1〜100億の間で入力してください"},"number-of-people":{min:1,max:9999,required:!0,message:"1〜9999の間で入力してください"},"organizer-burden":{min:1,max:100,required:!1,message:"1〜100の間で入力してください"},"organizer-fixed":{min:0,required:!1,message:"0以上の値を入力してください"}};this.validationRules=e}validateInput(e){const t=e.dataset.input,a=this.validationRules[t];if(!a)return!0;const r=parseInt(e.value,10),i=this.container.querySelector(`[data-error="${t}"]`);let n=!0,o="";return a.required&&(isNaN(r)||r===null||r==="")?(n=!1,o="この項目は必須です"):!isNaN(r)&&r!==null&&(a.min!==void 0&&r<a.min||a.max!==void 0&&r>a.max)&&(n=!1,o=a.message),i&&(n?(i.style.display="none",i.textContent="",e.style.borderColor="#ddd"):(i.style.display="block",i.textContent=o,e.style.borderColor="#e74c3c")),n}validateAllInputs(){const e=this.container.querySelectorAll("input[data-input]");let t=!0;if(e.forEach(a=>{this.validateInput(a)||(t=!1)}),this.currentType===s.ORGANIZER_FIXED){const a=this.getInputValue("total-amount");if(this.getInputValue("organizer-fixed")>=a){const i=this.container.querySelector('[data-input="organizer-fixed"]'),n=this.container.querySelector('[data-error="organizer-fixed"]');n&&(n.style.display="block",n.textContent="総額より少ない額を設定してください"),i&&(i.style.borderColor="#e74c3c"),t=!1}}return t||this.showError("入力内容を確認してください"),t}showError(e){const t=this.container.querySelector(".error-message");t&&t.remove();const a=document.createElement("div");a.className="error-message",a.style.cssText=`
            background: #fadbd8;
            color: #e74c3c;
            padding: 12px 16px;
            border-radius: 6px;
            margin: 16px 0;
            border-left: 4px solid #e74c3c;
        `,a.textContent=e;const r=this.container.querySelector('[data-element="calculate-button"]');r.parentNode.insertBefore(a,r),setTimeout(()=>{a.parentNode&&a.remove()},3e3)}setDefaultValues(){Object.entries(this.options.defaultValues).forEach(([e,t])=>{const a=this.container.querySelector(`[data-input="${e}"]`);a&&!a.value&&(a.value=t)}),this.updatePreview()}clear(){this.container.querySelectorAll("input[data-input]").forEach(a=>{a.value="",a.style.borderColor="#ddd"}),this.container.querySelectorAll("[data-error]").forEach(a=>{a.style.display="none",a.textContent=""}),this.resultContainer.style.display="none",this.historyButtonContainer.style.display="none",this.setDefaultValues()}getCurrentType(){return this.currentType}getLastResult(){if(!this.container.querySelector('[data-element="result-details"]')||this.resultContainer.style.display==="none")return null;const t=this.getInputValue("total-amount"),a=this.getInputValue("number-of-people");if(!t||!a)return null;const r={totalAmount:t,numberOfPeople:a,type:this.currentType};if(this.currentType!==s.EQUAL)switch(this.currentType){case s.ORGANIZER_MORE:case s.ORGANIZER_LESS:r.organizerBurden=this.getInputValue("organizer-burden");break;case s.ORGANIZER_FIXED:r.organizerFixed=this.getInputValue("organizer-fixed");break}try{return this.calculationEngine.calculate(r)}catch(i){return console.error("計算結果の取得エラー:",i),null}}}class k{constructor(e,t={}){this.container=e,this.options={maxDisplayItems:10,enableAnimation:!0,showTimestamp:!0,showTags:!1,onHistorySelect:null,onHistoryDelete:null,...t},this.currentEntries=[],this.filters={type:"all",dateFrom:null,dateTo:null,searchText:""},this.currentPage=1,this.itemsPerPage=this.options.maxDisplayItems,this.init()}init(){this.render(),this.bindEvents(),this.loadHistory()}render(){this.container.innerHTML=`
            <div class="history-list-container">
                <div class="history-header">
                    <h3 class="history-title">計算履歴</h3>
                    <div class="history-controls">
                        <select class="history-filter-type" data-filter="type">
                            <option value="all">すべて</option>
                            <option value="equal">均等割り</option>
                            <option value="organizer_more">幹事多め</option>
                            <option value="organizer_less">幹事少なめ</option>
                            <option value="organizer_fixed">幹事固定</option>
                        </select>
                        <button class="history-clear-btn" data-action="clear">
                            全て削除
                        </button>
                        <button class="history-close-btn" data-action="close">
                            ✕
                        </button>
                    </div>
                </div>

                <div class="history-search">
                    <input
                        type="text"
                        class="history-search-input"
                        placeholder="メモを検索..."
                        data-filter="search"
                    />
                </div>

                <div class="history-content">
                    <div class="history-list" data-container="list">
                        <!-- 履歴アイテムがここに挿入されます -->
                    </div>

                    <div class="history-empty" data-state="empty" style="display: none;">
                        <div class="empty-icon">📝</div>
                        <p class="empty-message">計算履歴がありません</p>
                        <p class="empty-description">計算を行うとここに履歴が表示されます</p>
                    </div>

                    <div class="history-loading" data-state="loading" style="display: none;">
                        <div class="loading-spinner"></div>
                        <p>読み込み中...</p>
                    </div>
                </div>

                <div class="history-footer">
                    <div class="history-pagination" data-container="pagination">
                        <!-- ページネーションがここに挿入されます -->
                    </div>
                    <div class="history-stats" data-container="stats">
                        <!-- 統計情報がここに挿入されます -->
                    </div>
                </div>
            </div>
        `,this.addStyles()}addStyles(){if(document.getElementById("history-list-styles"))return;const e=document.createElement("style");e.id="history-list-styles",e.textContent=`
            .history-list-container {
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                max-height: 600px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .history-header {
                padding: 20px;
                border-bottom: 1px solid #e0e0e0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .history-title {
                margin: 0 0 15px 0;
                font-size: 1.2rem;
                font-weight: 600;
            }

            .history-controls {
                display: flex;
                gap: 10px;
                align-items: center;
            }

            .history-filter-type {
                padding: 6px 12px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                font-size: 0.9rem;
            }

            .history-filter-type option {
                background: #333;
            }

            .history-clear-btn {
                padding: 6px 12px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                background: rgba(220, 53, 69, 0.8);
                color: white;
                font-size: 0.85rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .history-clear-btn:hover {
                background: rgba(220, 53, 69, 1);
                transform: translateY(-1px);
            }

            .history-close-btn {
                width: 30px;
                height: 30px;
                border: none;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                margin-left: auto;
                transition: all 0.3s ease;
            }

            .history-close-btn:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: scale(1.1);
            }

            .history-search {
                padding: 15px 20px;
                border-bottom: 1px solid #e0e0e0;
            }

            .history-search-input {
                width: 100%;
                padding: 10px 15px;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                font-size: 0.95rem;
                transition: all 0.3s ease;
            }

            .history-search-input:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            .history-content {
                flex: 1;
                overflow-y: auto;
                padding: 0;
            }

            .history-list {
                padding: 10px;
            }

            .history-item {
                padding: 15px;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                margin-bottom: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
                animation: slideIn 0.3s ease;
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .history-item:hover {
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                transform: translateY(-2px);
            }

            .history-item-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }

            .history-item-type {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
            }

            .history-item-type.equal {
                background: #e3f2fd;
                color: #1976d2;
            }

            .history-item-type.organizer_more {
                background: #fff3e0;
                color: #f57c00;
            }

            .history-item-type.organizer_less {
                background: #fce4ec;
                color: #c2185b;
            }

            .history-item-type.organizer_fixed {
                background: #f3e5f5;
                color: #7b1fa2;
            }

            .history-item-date {
                font-size: 0.85rem;
                color: #666;
            }

            .history-item-body {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 8px;
            }

            .history-item-amount {
                font-size: 1.1rem;
                font-weight: 600;
                color: #333;
            }

            .history-item-detail {
                font-size: 0.9rem;
                color: #666;
            }

            .history-item-note {
                font-size: 0.85rem;
                color: #888;
                font-style: italic;
                margin-top: 5px;
            }

            .history-item-actions {
                display: flex;
                gap: 5px;
                margin-top: 10px;
            }

            .history-item-btn {
                padding: 5px 10px;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                background: white;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .history-item-btn:hover {
                background: #f5f5f5;
            }

            .history-item-btn.delete {
                border-color: #ffcdd2;
                color: #c62828;
            }

            .history-item-btn.delete:hover {
                background: #ffcdd2;
            }

            .history-empty, .history-loading {
                text-align: center;
                padding: 60px 20px;
                color: #666;
            }

            .empty-icon {
                font-size: 3rem;
                margin-bottom: 15px;
            }

            .empty-message {
                font-size: 1.1rem;
                margin: 0 0 5px 0;
            }

            .empty-description {
                font-size: 0.9rem;
                margin: 0;
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 15px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .history-footer {
                padding: 15px 20px;
                border-top: 1px solid #e0e0e0;
                background: #f8f9fa;
            }

            .history-pagination {
                display: flex;
                justify-content: center;
                gap: 5px;
                margin-bottom: 10px;
            }

            .pagination-btn {
                padding: 5px 10px;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                background: white;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .pagination-btn:hover:not(:disabled) {
                background: #f5f5f5;
            }

            .pagination-btn.active {
                background: #667eea;
                color: white;
                border-color: #667eea;
            }

            .pagination-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .history-stats {
                text-align: center;
                font-size: 0.85rem;
                color: #666;
            }

            @media (max-width: 600px) {
                .history-item-body {
                    grid-template-columns: 1fr;
                }

                .history-controls {
                    flex-wrap: wrap;
                }

                .history-filter-type {
                    flex: 1;
                    min-width: 150px;
                }
            }
        `,document.head.appendChild(e)}bindEvents(){this.container.querySelector('[data-filter="type"]').addEventListener("change",n=>{this.filters.type=n.target.value,this.loadHistory()});const t=this.container.querySelector('[data-filter="search"]');let a;t.addEventListener("input",n=>{clearTimeout(a),a=setTimeout(()=>{this.filters.searchText=n.target.value.toLowerCase(),this.loadHistory()},300)}),this.container.querySelector('[data-action="clear"]').addEventListener("click",()=>{this.clearAllHistory()}),this.container.querySelector('[data-action="close"]').addEventListener("click",()=>{this.hide()}),this.container.addEventListener("click",n=>{n.target===this.container&&this.hide()})}async loadHistory(){this.showLoading(),setTimeout(()=>{const e={limit:this.itemsPerPage,offset:(this.currentPage-1)*this.itemsPerPage};this.filters.type!=="all"&&(e.type=this.filters.type),this.filters.dateFrom&&(e.dateFrom=this.filters.dateFrom),this.filters.dateTo&&(e.dateTo=this.filters.dateTo),this.currentEntries=p.getHistory(e),this.filters.searchText&&(this.currentEntries=this.currentEntries.filter(t=>t.note.toLowerCase().includes(this.filters.searchText))),this.renderHistoryList(),this.renderPagination(),this.renderStatistics()},100)}renderHistoryList(){const e=this.container.querySelector('[data-container="list"]'),t=this.container.querySelector('[data-state="empty"]'),a=this.container.querySelector('[data-state="loading"]');if(a.style.display="none",this.currentEntries.length===0){e.style.display="none",t.style.display="block";return}e.style.display="block",t.style.display="none",e.innerHTML=this.currentEntries.map(r=>{const i=new Date(r.createdAt),n=this.getTypeLabel(r.calculationResult.type),o=this.formatDate(i);return`
                <div class="history-item" data-id="${r.id}">
                    <div class="history-item-header">
                        <span class="history-item-type ${r.calculationResult.type}">
                            ${n}
                        </span>
                        <span class="history-item-date">${o}</span>
                    </div>
                    <div class="history-item-body">
                        <div class="history-item-amount">
                            ¥${r.calculationResult.perPerson.toLocaleString()}
                            <div class="history-item-detail">
                                一人あたり
                            </div>
                        </div>
                        <div class="history-item-amount">
                            ¥${r.calculationResult.total.toLocaleString()}
                            <div class="history-item-detail">
                                総額（${r.calculationResult.count}人）
                            </div>
                        </div>
                    </div>
                    ${r.calculationResult.remainder>0?`
                        <div class="history-item-detail">
                            余り: ¥${r.calculationResult.remainder.toLocaleString()}
                        </div>
                    `:""}
                    ${r.note?`
                        <div class="history-item-note">
                            📝 ${r.note}
                        </div>
                    `:""}
                    <div class="history-item-actions">
                        <button class="history-item-btn reuse" data-action="reuse" data-id="${r.id}">
                            再利用
                        </button>
                        <button class="history-item-btn delete" data-action="delete" data-id="${r.id}">
                            削除
                        </button>
                    </div>
                </div>
            `}).join(""),this.bindItemEvents()}bindItemEvents(){this.container.querySelector('[data-container="list"]').addEventListener("click",t=>{const a=t.target.dataset.action,r=t.target.dataset.id;if(a==="reuse")t.stopPropagation(),this.reuseHistory(r);else if(a==="delete")t.stopPropagation(),this.deleteHistory(r);else if(t.target.closest(".history-item")){const i=t.target.closest(".history-item").dataset.id;this.selectHistory(i)}})}reuseHistory(e){const t=p.getHistoryItem(e);if(!t)return;const a=t.calculationResult,r=document.getElementById("price"),i=document.getElementById("count");r&&(r.value=a.total),i&&(i.value=a.count),this.options.onHistorySelect&&this.options.onHistorySelect(t),this.showFeedback("計算を再利用しました"),this.hide()}selectHistory(e){if(!p.getHistoryItem(e))return;const a=this.container.querySelector(`[data-id="${e}"]`);a&&a.classList.toggle("selected")}deleteHistory(e){if(!confirm("この履歴を削除してもよろしいですか？"))return;p.deleteHistoryItem(e)?(this.showFeedback("履歴を削除しました"),this.loadHistory(),this.options.onHistoryDelete&&this.options.onHistoryDelete(e)):this.showFeedback("削除に失敗しました","error")}clearAllHistory(){confirm(`本当にすべての履歴を削除してもよろしいですか？
この操作は元に戻せません。`)&&(p.clearHistory(),this.showFeedback("すべての履歴を削除しました"),this.loadHistory())}renderPagination(){const e=this.container.querySelector('[data-container="pagination"]'),t=p.getHistory({limit:1e3}).length,a=Math.ceil(t/this.itemsPerPage);if(a<=1){e.innerHTML="";return}let r="";r+=`
            <button class="pagination-btn"
                    data-page="${this.currentPage-1}"
                    ${this.currentPage===1?"disabled":""}>
                前へ
            </button>
        `;for(let i=1;i<=Math.min(a,5);i++)r+=`
                <button class="pagination-btn ${i===this.currentPage?"active":""}"
                        data-page="${i}">
                    ${i}
                </button>
            `;r+=`
            <button class="pagination-btn"
                    data-page="${this.currentPage+1}"
                    ${this.currentPage===a?"disabled":""}>
                次へ
            </button>
        `,e.innerHTML=r,e.addEventListener("click",i=>{if(i.target.dataset.page){const n=parseInt(i.target.dataset.page);n>=1&&n<=a&&(this.currentPage=n,this.loadHistory())}})}renderStatistics(){const e=this.container.querySelector('[data-container="stats"]'),t=p.getStatistics();e.innerHTML=`
            合計 ${t.totalEntries}件 |
            平均額 ¥${t.averageAmount.toLocaleString()}
        `}showLoading(){const e=this.container.querySelector('[data-container="list"]'),t=this.container.querySelector('[data-state="empty"]'),a=this.container.querySelector('[data-state="loading"]');e.style.display="none",t.style.display="none",a.style.display="block"}showFeedback(e,t="success"){const a=document.createElement("div");a.className=`history-toast ${t}`,a.textContent=e,a.style.cssText=`
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 8px;
            background: ${t==="success"?"#4caf50":"#f44336"};
            color: white;
            font-size: 0.9rem;
            z-index: 10000;
            animation: slideUp 0.3s ease;
        `,document.body.appendChild(a),setTimeout(()=>{a.style.animation="slideDown 0.3s ease",setTimeout(()=>{document.body.removeChild(a)},300)},2e3)}show(){this.container.style.display="block",this.loadHistory()}hide(){this.container.style.display="none"}getTypeLabel(e){return{equal:"均等割り",organizer_more:"幹事多め",organizer_less:"幹事少なめ",organizer_fixed:"幹事固定"}[e]||"均等割り"}formatDate(e){const a=new Date-e,r=Math.floor(a/(1e3*60*60*24));if(r===0){const i=Math.floor(a/36e5);if(i===0){const n=Math.floor(a/6e4);return n===0?"たった今":`${n}分前`}return`${i}時間前`}else return r===1?"昨日":r<7?`${r}日前`:e.toLocaleDateString("ja-JP")}refresh(){this.loadHistory()}}class L{constructor(){this.baseUrl=window.location.origin+window.location.pathname,this.supportedSNS={twitter:{name:"X (Twitter)",url:"https://twitter.com/intent/tweet",maxLength:280},line:{name:"LINE",url:"https://social-plugins.line.me/lineit/share",maxLength:1e3},facebook:{name:"Facebook",url:"https://www.facebook.com/sharer/sharer.php",maxLength:null}}}encodeToUrl(e){try{if(!e||typeof e.totalAmount!="number"||typeof e.numberOfPeople!="number")throw new Error("Invalid calculation result");const t={t:e.totalAmount,n:e.numberOfPeople,type:e.type||"equal",ts:e.timestamp||Date.now()};e.type==="organizer_more"||e.type==="organizer_less"?t.b=e.organizerBurdenPercent||e.organizerReductionPercent:e.type==="organizer_fixed"&&(t.f=e.organizerFixedAmount);const a=JSON.stringify(t),r=btoa(unescape(encodeURIComponent(a))),i=new URL(this.baseUrl);return i.searchParams.set("calc",r),i.toString()}catch(t){return console.error("URLエンコードエラー:",t),this.baseUrl}}decodeFromUrl(e=window.location.href){try{const a=new URL(e).searchParams.get("calc");if(!a)return null;try{atob(a)}catch(o){return console.error("Invalid Base64 string:",o),null}const r=decodeURIComponent(escape(atob(a))),i=JSON.parse(r),n={totalAmount:i.t,numberOfPeople:i.n,type:i.type||"equal"};return i.type==="organizer_more"?n.organizerBurdenPercent=i.b:i.type==="organizer_less"?n.organizerReductionPercent=i.b:i.type==="organizer_fixed"&&(n.organizerFixedAmount=i.f),n}catch(t){return console.error("URLデコードエラー:",t),null}}async copyToClipboard(e,t={}){const{includeDetails:a=!0,customMessage:r=""}=t;try{let i=this.generateShareText(e,a);if(r&&(i=`${r}

${i}`),navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(i);else{const n=document.createElement("textarea");n.value=i,n.style.position="fixed",n.style.left="-999999px",n.style.top="-999999px",document.body.appendChild(n),n.focus(),n.select();const o=document.execCommand("copy");if(document.body.removeChild(n),!o)throw new Error("クリップボードへのコピーに失敗しました")}return!0}catch(i){return console.error("クリップボードコピーエラー:",i),!1}}generateSNSUrl(e,t,a={}){const{customMessage:r=""}=a,i=this.supportedSNS[e];if(!i)return console.error(`未対応のSNS: ${e}`),null;try{let n=this.generateShareText(t,!1);r&&(n=`${r} ${n}`),i.maxLength&&n.length>i.maxLength&&(n=n.substring(0,i.maxLength-3)+"...");const o=this.encodeToUrl(t),l=new URLSearchParams;switch(e){case"twitter":return l.set("text",n),l.set("url",o),`${i.url}?${l.toString()}`;case"line":return l.set("url",o),`${i.url}?${l.toString()}`;case"facebook":return l.set("u",o),l.set("quote",n),`${i.url}?${l.toString()}`;default:return null}}catch(n){return console.error("SNS URL生成エラー:",n),null}}generateShareText(e,t=!0){const a={equal:"均等割り",organizer_more:"幹事多め負担",organizer_less:"幹事少なめ負担",organizer_fixed:"幹事固定額"};let r=`【割り勘計算】
`;return r+=`総額: ${e.totalAmount.toLocaleString()}円
`,r+=`人数: ${e.numberOfPeople}人
`,r+=`パターン: ${a[e.type]||"均等割り"}
`,t&&(r+=`
`,e.type==="equal"?(r+=`一人当たり: ${e.perPerson.toLocaleString()}円`,e.remainder>0&&(r+=`
余り: ${e.remainder}円`)):(r+=`幹事: ${e.organizerPayment.toLocaleString()}円
`,r+=`参加者一人: ${e.participantPayment.toLocaleString()}円`,e.remainder>0&&(r+=`
余り: ${e.remainder}円`))),r+=`

計算アプリで詳細を見る`,r}async nativeShare(e,t={}){const{title:a="割り勘計算",text:r=""}=t;try{if(!navigator.share)return!1;const i={title:a,text:r||this.generateShareText(e,!1),url:this.encodeToUrl(e)};return await navigator.share(i),!0}catch(i){return i.name!=="AbortError"&&console.error("ネイティブシェアエラー:",i),!1}}generateQRCode(e,t={}){const{size:a=200}=t;console.warn("QRコード生成機能は未実装です。外部ライブラリの導入が必要です。");const r=this.encodeToUrl(e);return`data:image/svg+xml;base64,${btoa(`
            <svg width="${a}" height="${a}" viewBox="0 0 ${a} ${a}" xmlns="http://www.w3.org/2000/svg">
                <rect width="${a}" height="${a}" fill="white"/>
                <text x="${a/2}" y="${a/2}" text-anchor="middle" font-size="12" fill="black">
                    QR Code
                </text>
                <text x="${a/2}" y="${a/2+20}" text-anchor="middle" font-size="8" fill="black">
                    ${r.substring(0,30)}...
                </text>
            </svg>
        `)}`}getSupportedSNS(){return Object.entries(this.supportedSNS).map(([e,t])=>({key:e,name:t.name,url:t.url}))}checkShareSupport(){return{clipboard:!!(navigator.clipboard&&window.isSecureContext)||!!document.execCommand,nativeShare:!!navigator.share,sns:this.getSupportedSNS(),urlParameters:!0}}}const u=new L;class I{constructor(e,t={}){this.container=e,this.options={enableAnimation:!0,theme:"default",...t},this.modal=null,this.overlay=null,this.currentResult=null,this.isVisible=!1,this.init()}init(){this.createModal(),this.bindEvents()}createModal(){this.overlay=document.createElement("div"),this.overlay.className="share-modal-overlay",this.overlay.setAttribute("data-element","overlay"),this.overlay.style.cssText=`
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `,this.modal=document.createElement("div"),this.modal.className="share-modal",this.modal.setAttribute("data-element","modal"),this.modal.style.cssText=`
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 480px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            transform: translateY(20px) scale(0.95);
            transition: transform 0.3s ease, opacity 0.3s ease;
            opacity: 0;
        `,this.modal.innerHTML=`
            <div class="share-modal-header" data-element="header">
                <h2 style="margin: 0; font-size: 1.4rem; color: #333;">計算結果をシェア</h2>
                <button class="share-modal-close" data-element="close" style="
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 4px;
                    color: #666;
                ">×</button>
            </div>

            <div class="share-modal-content" data-element="content">
                <div class="share-preview" data-element="preview" style="
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 20px;
                ">
                    <div class="share-preview-text" data-element="preview-text"></div>
                </div>

                <div class="share-actions" data-element="actions">
                    <h3 style="margin: 0 0 12px 0; font-size: 1.1rem; color: #333;">シェア方法</h3>

                    <div class="share-buttons" data-element="share-buttons" style="
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 12px;
                        margin-bottom: 20px;
                    ">
                        <button class="share-button share-button-clipboard" data-action="clipboard" style="
                            padding: 12px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            background: white;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <span style="font-size: 20px;">📋</span>
                            <span>クリップボード</span>
                        </button>

                        <button class="share-button share-button-native" data-action="native" style="
                            padding: 12px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            background: white;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <span style="font-size: 20px;">📱</span>
                            <span>共有</span>
                        </button>

                        <button class="share-button share-button-twitter" data-action="twitter" style="
                            padding: 12px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            background: white;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <span style="font-size: 20px;">𝕏</span>
                            <span>X (Twitter)</span>
                        </button>

                        <button class="share-button share-button-line" data-action="line" style="
                            padding: 12px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            background: white;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <span style="font-size: 20px;">💬</span>
                            <span>LINE</span>
                        </button>

                        <button class="share-button share-button-facebook" data-action="facebook" style="
                            padding: 12px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            background: white;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <span style="font-size: 20px;">📘</span>
                            <span>Facebook</span>
                        </button>

                        <button class="share-button share-button-url" data-action="url" style="
                            padding: 12px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            background: white;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <span style="font-size: 20px;">🔗</span>
                            <span>URLコピー</span>
                        </button>
                    </div>

                    <div class="share-custom-message" data-element="custom-message" style="
                        margin-bottom: 20px;
                    ">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                            追加メッセージ（任意）
                        </label>
                        <textarea class="share-message-input" data-element="message-input" style="
                            width: 100%;
                            min-height: 60px;
                            padding: 8px;
                            border: 1px solid #ddd;
                            border-radius: 6px;
                            resize: vertical;
                            font-family: inherit;
                        " placeholder="例: ランチのお会計です"></textarea>
                    </div>

                    <div class="share-url" data-element="url-section" style="
                        display: none;
                        background: #f0f0f0;
                        padding: 12px;
                        border-radius: 6px;
                        font-family: monospace;
                        font-size: 0.9rem;
                        word-break: break-all;
                        margin-bottom: 12px;
                    "></div>
                </div>
            </div>
        `,this.overlay.appendChild(this.modal),document.body.appendChild(this.overlay),this.addStyles()}addStyles(){const e="share-ui-styles";if(!document.getElementById(e)){const t=document.createElement("style");t.id=e,t.textContent=`
                .share-modal-overlay.show {
                    display: flex;
                }

                .share-modal-overlay.show .share-modal {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }

                .share-modal-overlay.visible .share-modal {
                    opacity: 1;
                }

                .share-button:hover {
                    border-color: #667eea;
                    background: #f8f9ff;
                    transform: translateY(-2px);
                }

                .share-button:active {
                    transform: translateY(0);
                }

                .share-button.success {
                    border-color: #27ae60;
                    background: #d5f4e6;
                }

                .share-button.error {
                    border-color: #e74c3c;
                    background: #fadbd8;
                }

                .share-preview {
                    border: 1px solid #e0e0e0;
                }

                .share-preview-text {
                    white-space: pre-line;
                    line-height: 1.5;
                    color: #333;
                }

                @media (max-width: 480px) {
                    .share-modal {
                        width: 95%;
                        padding: 20px;
                    }

                    .share-buttons {
                        grid-template-columns: 1fr;
                    }
                }

                .share-feedback {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #27ae60;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    transform: translateX(400px);
                    transition: transform 0.3s ease;
                    z-index: 2000;
                }

                .share-feedback.show {
                    transform: translateX(0);
                }

                .share-feedback.error {
                    background: #e74c3c;
                }
            `,document.head.appendChild(t)}}bindEvents(){this.overlay.addEventListener("click",a=>{a.target===this.overlay&&this.hide()}),this.modal.querySelector('[data-element="close"]').addEventListener("click",()=>{this.hide()}),document.addEventListener("keydown",a=>{a.key==="Escape"&&this.isVisible&&this.hide()}),this.modal.querySelectorAll("[data-action]").forEach(a=>{a.addEventListener("click",r=>{const i=r.currentTarget.dataset.action;this.handleShareAction(i)})})}show(e,t={}){this.currentResult=e,this.updatePreview(e);const a=u.encodeToUrl(e);this.updateUrlSection(a),this.isVisible=!0,this.overlay.style.display="flex",this.options.enableAnimation?requestAnimationFrame(()=>{this.overlay.classList.add("show"),this.overlay.style.opacity="1"}):(this.overlay.classList.add("show"),this.overlay.style.opacity="1");const r=this.modal.querySelector("[data-action]");r&&r.focus()}hide(){this.isVisible=!1,this.options.enableAnimation?(this.overlay.style.opacity="0",this.overlay.classList.remove("show"),setTimeout(()=>{this.overlay.style.display==="flex"&&(this.overlay.style.display="none")},300)):(this.overlay.classList.remove("show"),this.overlay.style.display="none")}updatePreview(e){const t=this.modal.querySelector('[data-element="preview-text"]'),a=u.generateShareText(e);t.textContent=a}updateUrlSection(e){const t=this.modal.querySelector('[data-element="url-section"]');t.textContent=e,t.dataset.url=e}async handleShareAction(e){if(!this.currentResult)return;const t=this.modal.querySelector(`[data-action="${e}"]`),a=t.innerHTML;try{t.innerHTML='<span style="font-size: 20px;">⏳</span><span>処理中...</span>',t.disabled=!0;const i=this.modal.querySelector('[data-element="message-input"]').value.trim();let n=!1,o="";switch(e){case"clipboard":n=await u.copyToClipboard(this.currentResult,{customMessage:i}),o=n?"クリップボードにコピーしました":"コピーに失敗しました";break;case"native":if(n=await u.nativeShare(this.currentResult,{text:i}),n){this.hide();return}o="共有に失敗しました";break;case"twitter":case"line":case"facebook":const l=u.generateSNSUrl(e,this.currentResult,{customMessage:i});l&&(window.open(l,"_blank","width=600,height=400"),n=!0);break;case"url":const d=u.encodeToUrl(this.currentResult);n=await this.copyToClipboard(d),o=n?"URLをコピーしました":"URLのコピーに失敗しました";const h=this.modal.querySelector('[data-element="url-section"]');h.style.display="block";break}n?(t.classList.add("success"),o||(o="シェアしました"),this.showFeedback(o,!1)):(t.classList.add("error"),o||(o="シェアに失敗しました"),this.showFeedback(o,!0)),setTimeout(()=>{t.innerHTML=a,t.disabled=!1,t.classList.remove("success","error")},2e3)}catch(r){console.error("シェアアクションエラー:",r),t.innerHTML=a,t.disabled=!1,t.classList.add("error"),this.showFeedback("エラーが発生しました",!0)}}async copyToClipboard(e){try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(e);else{const t=document.createElement("textarea");t.value=e,t.style.position="fixed",t.style.left="-999999px",t.style.top="-999999px",document.body.appendChild(t),t.focus(),t.select(),document.execCommand("copy"),document.body.removeChild(t)}return!0}catch(t){return console.error("クリップボードエラー:",t),!1}}showFeedback(e,t=!1){const a=document.querySelector(".share-feedback");a&&a.remove();const r=document.createElement("div");r.className=`share-feedback ${t?"error":""}`,r.textContent=e,document.body.appendChild(r),requestAnimationFrame(()=>{r.classList.add("show")}),setTimeout(()=>{r.classList.remove("show"),setTimeout(()=>{r.parentNode&&r.remove()},300)},3e3)}destroy(){this.overlay&&this.overlay.parentNode&&this.overlay.parentNode.removeChild(this.overlay);const e=document.getElementById("share-ui-styles");e&&e.remove()}}class R{constructor(){this.calculationEngine=new f,this.storage=p,this.organizerUI=null,this.historyList=null,this.shareUI=null,this.currentResult=null,this.isHistoryVisible=!1,this.init()}init(){this.setupUI(),this.bindEvents(),this.loadFromURL(),this.initializeStyles()}setupUI(){const e=document.querySelector(".container");if(!e){console.error("メインコンテナが見つかりません");return}e.innerHTML="";const t=document.createElement("header");t.innerHTML=`
            <h1 style="text-align: center; color: #333; margin-bottom: 32px;">
                割り勘計算機
                <span style="font-size: 0.8rem; color: #666; display: block; margin-top: 8px;">
                    履歴保存・シェア機能付き
                </span>
            </h1>
        `;const a=document.createElement("div");a.id="organizer-container";const r=document.createElement("div");r.id="history-container",r.style.cssText=`
            display: none;
            margin-top: 32px;
            padding: 24px;
            background: #f8f9fa;
            border-radius: 8px;
        `;const i=document.createElement("div");i.id="share-overlay",e.appendChild(t),e.appendChild(a),e.appendChild(r),document.body.appendChild(i),this.organizerUI=new z(a,{onCalculate:n=>this.handleCalculate(n)}),this.historyList=new k(r,{maxDisplayItems:10,enableAnimation:!0}),this.shareUI=new I(i)}bindEvents(){this.organizerUI.container.addEventListener("organizerUI:action",e=>{const{action:t}=e.detail;this.handleAction(t)}),this.historyList.container.addEventListener("historyList:select",e=>{const{entry:t}=e.detail;this.loadHistoryEntry(t)}),this.historyList.container.addEventListener("historyList:delete",e=>{const{id:t}=e.detail;this.deleteHistoryEntry(t)}),this.historyList.container.addEventListener("historyList:clear",()=>{this.clearHistory()}),this.organizerUI.container.addEventListener("organizerUI:save",e=>{const{result:t,note:a}=e.detail;this.saveToHistory(t,a)}),window.addEventListener("popstate",e=>{e.state&&e.state.calculation&&this.loadCalculation(e.state.calculation)}),document.addEventListener("keydown",e=>{if(e.ctrlKey||e.metaKey)switch(e.key){case"s":e.preventDefault(),this.currentResult&&this.saveToHistory(this.currentResult);break;case"h":e.preventDefault(),this.toggleHistory();break;case"Enter":e.preventDefault(),this.currentResult&&this.shareUI.show(this.currentResult);break}})}handleCalculate(e){this.currentResult=e,this.saveToHistory(e),this.updateURL(e),this.showActionButtons()}handleAction(e){switch(e){case"share":this.currentResult&&this.shareUI.show(this.currentResult);break;case"save":this.currentResult&&(this.saveToHistory(this.currentResult),this.showNotification("履歴に保存しました"));break;case"history":this.toggleHistory();break;case"clear":this.organizerUI.clear(),this.currentResult=null,this.hideActionButtons(),this.updateURL(null);break}}saveToHistory(e,t=""){try{const a=this.storage.saveCalculation(e,t);return console.log("履歴を保存しました:",a),this.isHistoryVisible&&this.refreshHistory(),a}catch(a){return console.error("履歴の保存に失敗しました:",a),this.showNotification("履歴の保存に失敗しました",!0),null}}toggleHistory(){const e=document.getElementById("history-container");this.isHistoryVisible?(e.style.display="none",this.isHistoryVisible=!1):(e.style.display="block",this.isHistoryVisible=!0,this.refreshHistory())}refreshHistory(){const e=this.storage.getHistory({limit:20});this.historyList.renderHistoryList(e)}loadHistoryEntry(e){const t=e.calculationResult;this.loadCalculation(t),this.toggleHistory(),this.updateURL(t)}deleteHistoryEntry(e){this.storage.deleteHistoryItem(e)?(this.refreshHistory(),this.showNotification("履歴を削除しました")):this.showNotification("削除に失敗しました",!0)}clearHistory(){confirm("すべての履歴を削除してもよろしいですか？")&&(this.storage.clearHistory(),this.refreshHistory(),this.showNotification("履歴をクリアしました"))}loadCalculation(e){this.organizerUI.selectPattern(e.type);const t=document.getElementById("total-amount"),a=document.getElementById("number-of-people");switch(t&&(t.value=e.totalAmount),a&&(a.value=e.numberOfPeople),e.type){case s.ORGANIZER_MORE:const r=document.getElementById("organizer-burden-more");r&&e.organizerBurdenPercent&&(r.value=e.organizerBurdenPercent);break;case s.ORGANIZER_LESS:const i=document.getElementById("organizer-burden-less");i&&e.organizerReductionPercent&&(i.value=e.organizerReductionPercent);break;case s.ORGANIZER_FIXED:const n=document.getElementById("organizer-fixed");n&&e.organizerFixedAmount&&(n.value=e.organizerFixedAmount);break}this.currentResult=e,this.organizerUI.displayResult(e),this.showActionButtons()}updateURL(e){if(e){const t=u.encodeToUrl(e),a=new URL(window.location);a.search=new URL(t).search,history.pushState({calculation:e},"",a)}else{const t=new URL(window.location);t.search="",history.pushState({},"",t)}}loadFromURL(){const e=u.decodeFromUrl();if(e)try{const t=this.calculationEngine.calculate(e);this.loadCalculation(t)}catch(t){console.error("URLからの読み込みに失敗:",t)}}showActionButtons(){const e=document.querySelector('[data-element="action-buttons"]');e&&(e.style.display="grid")}hideActionButtons(){const e=document.querySelector('[data-element="action-buttons"]');e&&(e.style.display="none")}showNotification(e,t=!1){const a=document.createElement("div");a.style.cssText=`
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${t?"#e74c3c":"#27ae60"};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            font-weight: 500;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `,a.textContent=e,document.body.appendChild(a),requestAnimationFrame(()=>{a.style.transform="translateX(0)"}),setTimeout(()=>{a.style.transform="translateX(400px)",setTimeout(()=>{a.parentNode&&a.remove()},300)},3e3)}initializeStyles(){const e="warikan-app-styles";if(!document.getElementById(e)){const t=document.createElement("style");t.id=e,t.textContent=`
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
                              'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                }

                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 32px;
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                }

                @media (max-width: 768px) {
                    body {
                        padding: 10px;
                    }

                    .container {
                        padding: 20px;
                    }
                }

                /* 既存のスタイルを維持 */
                .fade-in {
                    animation: fadeIn 0.5s ease-in;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .pulse {
                    animation: pulse 0.5s ease;
                }

                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }

                .error {
                    animation: shake 0.5s ease;
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            `,document.head.appendChild(t)}}}document.addEventListener("DOMContentLoaded",()=>{new R});window.addEventListener("error",c=>{console.error("アプリケーションエラー:",c.error)});"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").then(c=>{console.log("SW registered: ",c)}).catch(c=>{console.log("SW registration failed: ",c)})});
